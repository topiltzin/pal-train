import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const APP_ORIGIN = "https://pal-train.vercel.app";
const SECRET = "s".repeat(32);

beforeAll(() => {
  vi.stubEnv("BETTER_AUTH_URL", APP_ORIGIN);
  vi.stubEnv("BETTER_AUTH_SECRET", SECRET);
  vi.stubEnv("DATABASE_URL", "postgres://user:pass@localhost:5432/app");
});

afterAll(() => {
  vi.unstubAllEnvs();
});

describe("GET /.well-known/oauth-protected-resource/mcp", () => {
  it("returns the RFC 9728 document with the resource, the Better Auth issuer, and the read-only scopes", async () => {
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
      authorization_servers: [`${APP_ORIGIN}/api/auth`],
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
    expect(text).not.toContain(SECRET);
  });
});
