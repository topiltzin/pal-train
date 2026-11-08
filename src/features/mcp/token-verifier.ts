import { errors, jwtVerify, type JWTVerifyGetKey } from "jose";

/** The only signing algorithm accepted. Pinning it rejects `alg: none` and downgrades. */
const ALLOWED_ALGORITHMS = ["RS256"];
const SCOPE_SEPARATOR = " ";

export type VerifierSettings = {
  issuer: string;
  /** This server's resource identifier: the only audience accepted. */
  resource: string;
  jwks: JWTVerifyGetKey;
  /** A scope every accepted token must carry (spec FR-004). */
  requiredScope: string;
};

export type VerifiedAuth = {
  userId: string;
  clientId: string | undefined;
  scopes: string[];
  expiresAt: number;
  /** When Auth0 issued the token, i.e. when the user last consented (used for reconnects). */
  issuedAt: Date;
  resource: string;
};

export type RefusalReason = "invalid" | "expired" | "wrong_audience" | "missing_scope";

export type VerifyResult = { ok: true; auth: VerifiedAuth } | { ok: false; reason: RefusalReason };

function refusalFor(error: unknown): RefusalReason {
  if (error instanceof errors.JWTExpired) {
    return "expired";
  }
  if (error instanceof errors.JWTClaimValidationFailed && error.claim === "aud") {
    return "wrong_audience";
  }
  return "invalid";
}

function scopesOf(scope: unknown): string[] {
  return typeof scope === "string" ? scope.split(SCOPE_SEPARATOR).filter(Boolean) : [];
}

/**
 * Verifies an access token issued by Auth0 for this resource. The token is never logged, and a
 * refusal carries only a reason code, never the token or its claims.
 */
export async function verifyAccessToken(
  token: string,
  settings: VerifierSettings,
): Promise<VerifyResult> {
  let payload;
  try {
    ({ payload } = await jwtVerify(token, settings.jwks, {
      issuer: settings.issuer,
      audience: settings.resource,
      algorithms: ALLOWED_ALGORITHMS,
    }));
  } catch (error) {
    return { ok: false, reason: refusalFor(error) };
  }

  const scopes = scopesOf(payload.scope);
  if (!scopes.includes(settings.requiredScope)) {
    return { ok: false, reason: "missing_scope" };
  }
  if (typeof payload.sub !== "string" || payload.exp === undefined) {
    return { ok: false, reason: "invalid" };
  }
  return {
    ok: true,
    auth: {
      userId: payload.sub,
      clientId: typeof payload.azp === "string" ? payload.azp : undefined,
      scopes,
      expiresAt: payload.exp,
      issuedAt: new Date((typeof payload.iat === "number" ? payload.iat : 0) * 1000),
      resource: settings.resource,
    },
  };
}
