import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const APP_ORIGIN = "https://pal-train.vercel.app";
const AUTH0_DOMAIN = "example.us.auth0.com";

beforeAll(() => {
  vi.stubEnv("APP_BASE_URL", APP_ORIGIN);
  vi.stubEnv("AUTH0_DOMAIN", AUTH0_DOMAIN);
  vi.stubEnv("AUTH0_SECRET", "s".repeat(32));
  vi.stubEnv("AUTH0_CLIENT_ID", "client-id");
  vi.stubEnv("AUTH0_CLIENT_SECRET", "client-secret");
  vi.stubEnv("DATABASE_URL", "postgres://user:pass@localhost:5432/app");
});

afterAll(() => {
  vi.unstubAllEnvs();
});

describe("GET /.well-known/oauth-protected-resource/mcp", () => {
  it("returns the RFC 9728 document with the resource, the Auth0 issuer, and the read-only scopes", async () => {
    // Arrange
    const { GET } = await import("@/app/.well-known/oauth-protected-resource/mcp/route");

    // Act
    const response = await GET();
    const body = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(body).toEqual({
      resource: `${APP_ORIGIN}/mcp`,
      authorization_servers: [`https://${AUTH0_DOMAIN}/`],
      scopes_supported: ["plans:read", "library:read"],
      bearer_methods_supported: ["header"],
    });
  });

  it("contains no secret values", async () => {
    // Arrange
    const { GET } = await import("@/app/.well-known/oauth-protected-resource/mcp/route");

    // Act
    const text = await (await GET()).text();

    // Assert
    expect(text).not.toContain("client-secret");
    expect(text).not.toContain("s".repeat(32));
  });
});
