import { describe, expect, it } from "vitest";
import { SignJWT, createLocalJWKSet, exportJWK, generateKeyPair } from "jose";
import { createMcpAuthGate } from "@/features/mcp/mcp-auth";

const ISSUER = "https://example.us.auth0.com/";
const RESOURCE = "https://pal-train.vercel.app/mcp";
const RESOURCE_METADATA_URL =
  "https://pal-train.vercel.app/.well-known/oauth-protected-resource/mcp";
const KID = "gate-test-key";

async function fixtures() {
  const { publicKey, privateKey } = await generateKeyPair("RS256");
  const jwk = { ...(await exportJWK(publicKey)), kid: KID, alg: "RS256", use: "sig" };
  const gate = createMcpAuthGate({
    settings: {
      issuer: ISSUER,
      resource: RESOURCE,
      jwks: createLocalJWKSet({ keys: [jwk] }),
      requiredScope: "plans:read",
    },
    resourceMetadataUrl: RESOURCE_METADATA_URL,
  });
  return { gate, privateKey };
}

async function tokenWith(privateKey: CryptoKey, scope = "plans:read library:read") {
  return new SignJWT({ scope, azp: "client-1" })
    .setProtectedHeader({ alg: "RS256", kid: KID })
    .setIssuer(ISSUER)
    .setAudience(RESOURCE)
    .setSubject("auth0|user-1")
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + 600)
    .sign(privateKey);
}

function requestWith(authorization?: string): Request {
  const headers: Record<string, string> = authorization ? { authorization } : {};
  return new Request(RESOURCE, { method: "POST", headers });
}

describe("MCP bearer gate", () => {
  it("answers 401 with a resource metadata challenge when no token is sent", async () => {
    // Arrange
    const { gate } = await fixtures();

    // Act
    const result = await gate(requestWith());

    // Assert
    expect(result).toBeInstanceOf(Response);
    const response = result as Response;
    expect(response.status).toBe(401);
    expect(response.headers.get("www-authenticate")).toContain(
      `resource_metadata="${RESOURCE_METADATA_URL}"`,
    );
  });

  it("answers 401 invalid_token for a malformed token", async () => {
    // Arrange
    const { gate } = await fixtures();

    // Act
    const response = (await gate(requestWith("Bearer not-a-jwt"))) as Response;

    // Assert
    expect(response.status).toBe(401);
    expect(response.headers.get("www-authenticate")).toContain('error="invalid_token"');
  });

  it("answers 403 insufficient_scope when the token lacks the required scope", async () => {
    // Arrange
    const { gate, privateKey } = await fixtures();
    const token = await tokenWith(privateKey, "library:read");

    // Act
    const response = (await gate(requestWith(`Bearer ${token}`))) as Response;

    // Assert
    expect(response.status).toBe(403);
    expect(response.headers.get("www-authenticate")).toContain('error="insufficient_scope"');
  });

  it("passes a valid token through as the caller's authentication info", async () => {
    // Arrange
    const { gate, privateKey } = await fixtures();
    const token = await tokenWith(privateKey);

    // Act
    const result = await gate(requestWith(`Bearer ${token}`));

    // Assert
    expect(result).not.toBeInstanceOf(Response);
    expect(result).toMatchObject({ clientId: "client-1", scopes: ["plans:read", "library:read"] });
  });
});
