import {
  OAuthError,
  OAuthErrorCode,
  requireBearerAuth,
  type AuthInfo,
  type OAuthTokenVerifier,
} from "@modelcontextprotocol/server";
import {
  verifyAccessToken,
  type RefusalReason,
  type VerifierSettings,
} from "@/features/mcp/token-verifier";

export type McpAuthGateOptions = {
  settings: VerifierSettings;
  /** The RFC 9728 metadata URL advertised in every 401 and 403 challenge. */
  resourceMetadataUrl: string;
};

const REFUSAL_MESSAGES: Record<RefusalReason, string> = {
  invalid: "The access token is not valid.",
  expired: "The access token has expired.",
  wrong_audience: "The access token was issued for a different resource.",
  missing_scope: "The access token does not grant the required scope.",
};

/** Maps a refusal to the SDK error that sets the right status and challenge. */
function refusalError(reason: RefusalReason): OAuthError {
  const code =
    reason === "missing_scope" ? OAuthErrorCode.InsufficientScope : OAuthErrorCode.InvalidToken;
  return new OAuthError(code, REFUSAL_MESSAGES[reason]);
}

function verifierFor(settings: VerifierSettings): OAuthTokenVerifier {
  return {
    async verifyAccessToken(token: string): Promise<AuthInfo> {
      const result = await verifyAccessToken(token, settings);
      if (!result.ok) {
        throw refusalError(result.reason);
      }
      if (result.auth.clientId === undefined) {
        throw refusalError("invalid");
      }
      return {
        token,
        clientId: result.auth.clientId,
        scopes: result.auth.scopes,
        expiresAt: result.auth.expiresAt,
        resource: new URL(result.auth.resource),
        extra: { userId: result.auth.userId, issuedAt: result.auth.issuedAt },
      };
    },
  };
}

/**
 * The bearer gate for the MCP endpoint. Returns the caller's authentication info, or a ready
 * 401/403 response with the challenge (spec FR-006). Tokens are never logged.
 */
export function createMcpAuthGate(options: McpAuthGateOptions) {
  return requireBearerAuth({
    verifier: verifierFor(options.settings),
    expectedResource: new URL(options.settings.resource),
    resourceMetadataUrl: options.resourceMetadataUrl,
  });
}
