import { describe, expect, it } from "vitest";
import { SignJWT, createLocalJWKSet, exportJWK, generateKeyPair } from "jose";
import { verifyAccessToken, type VerifierSettings } from "@/features/mcp/token-verifier";

const ISSUER = "https://example.us.auth0.com/";
const RESOURCE = "https://pal-train.vercel.app/mcp";
const KID = "test-key-1";

async function signingKeys() {
  const { publicKey, privateKey } = await generateKeyPair("RS256");
  const jwk = { ...(await exportJWK(publicKey)), kid: KID, alg: "RS256", use: "sig" };
  return { privateKey, jwks: createLocalJWKSet({ keys: [jwk] }) };
}

async function sign(
  privateKey: CryptoKey,
  claims: { aud?: string; iss?: string; scope?: string; exp?: number; sub?: string },
) {
  return new SignJWT({ scope: claims.scope ?? "plans:read library:read", azp: "client-1" })
    .setProtectedHeader({ alg: "RS256", kid: KID })
    .setIssuer(claims.iss ?? ISSUER)
    .setAudience(claims.aud ?? RESOURCE)
    .setSubject(claims.sub ?? "auth0|user-1")
    .setIssuedAt()
    .setExpirationTime(claims.exp ?? Math.floor(Date.now() / 1000) + 600)
    .sign(privateKey);
}

async function settings(): Promise<VerifierSettings> {
  const { jwks } = await signingKeys();
  return { issuer: ISSUER, resource: RESOURCE, jwks, requiredScope: "plans:read" };
}

describe("verifyAccessToken", () => {
  it("accepts a correctly signed token with the right issuer, audience, expiry, and scope", async () => {
    // Arrange
    const { privateKey, jwks } = await signingKeys();
    const token = await sign(privateKey, {});

    // Act
    const result = await verifyAccessToken(token, { ...(await settings()), jwks });

    // Assert
    expect(result).toMatchObject({
      ok: true,
      auth: { userId: "auth0|user-1", clientId: "client-1", resource: RESOURCE },
    });
    expect(result.ok && result.auth.scopes).toEqual(["plans:read", "library:read"]);
  });

  it("refuses a token signed with a different key", async () => {
    // Arrange
    const { jwks } = await signingKeys();
    const attacker = await signingKeys();
    const token = await sign(attacker.privateKey, {});

    // Act
    const result = await verifyAccessToken(token, { ...(await settings()), jwks });

    // Assert
    expect(result).toEqual({ ok: false, reason: "invalid" });
  });

  it("refuses an unsigned token with alg none", async () => {
    // Arrange
    const { jwks } = await signingKeys();
    const header = Buffer.from(JSON.stringify({ alg: "none" })).toString("base64url");
    const payload = Buffer.from(
      JSON.stringify({ iss: ISSUER, aud: RESOURCE, sub: "auth0|user-1", scope: "plans:read" }),
    ).toString("base64url");
    const token = `${header}.${payload}.`;

    // Act
    const result = await verifyAccessToken(token, { ...(await settings()), jwks });

    // Assert
    expect(result).toEqual({ ok: false, reason: "invalid" });
  });

  it("refuses a token from a different issuer", async () => {
    // Arrange
    const { privateKey, jwks } = await signingKeys();
    const token = await sign(privateKey, { iss: "https://evil.example.com/" });

    // Act
    const result = await verifyAccessToken(token, { ...(await settings()), jwks });

    // Assert
    expect(result).toEqual({ ok: false, reason: "invalid" });
  });

  it("refuses a token whose audience is not this server's resource", async () => {
    // Arrange
    const { privateKey, jwks } = await signingKeys();
    const token = await sign(privateKey, { aud: "https://other.example.com/mcp" });

    // Act
    const result = await verifyAccessToken(token, { ...(await settings()), jwks });

    // Assert
    expect(result).toEqual({ ok: false, reason: "wrong_audience" });
  });

  it("refuses an expired token", async () => {
    // Arrange
    const { privateKey, jwks } = await signingKeys();
    const token = await sign(privateKey, { exp: Math.floor(Date.now() / 1000) - 60 });

    // Act
    const result = await verifyAccessToken(token, { ...(await settings()), jwks });

    // Assert
    expect(result).toEqual({ ok: false, reason: "expired" });
  });

  it("refuses a token that lacks the required scope", async () => {
    // Arrange
    const { privateKey, jwks } = await signingKeys();
    const token = await sign(privateKey, { scope: "library:read" });

    // Act
    const result = await verifyAccessToken(token, { ...(await settings()), jwks });

    // Assert
    expect(result).toEqual({ ok: false, reason: "missing_scope" });
  });
});
