import { describe, expect, it } from "vitest";
import { buildAuthOptions, buildMcpSettings } from "@/lib/auth/auth-options";

const settings = {
  baseURL: "https://www.pal-buddy.eu",
  secret: "s".repeat(32),
  resource: "https://www.pal-buddy.eu/mcp",
  database: {} as never,
};

function pluginById(options: ReturnType<typeof buildAuthOptions>, id: string) {
  return options.plugins.find((plugin) => plugin.id === id);
}

describe("buildAuthOptions", () => {
  it("enables email and password sign-in", () => {
    // Arrange, Act
    const options = buildAuthOptions(settings);

    // Assert
    expect(options.emailAndPassword?.enabled).toBe(true);
  });

  it("disables the token endpoint so session JWTs are never accepted as access tokens", () => {
    // Arrange, Act
    const options = buildAuthOptions(settings);

    // Assert
    expect(options.disabledPaths).toContain("/token");
  });

  it("registers the JWT plugin and the OAuth provider that the MCP plugin wraps", () => {
    // Arrange, Act
    const options = buildAuthOptions(settings);

    // Assert
    expect(pluginById(options, "jwt")).toBeDefined();
    expect(pluginById(options, "oauth-provider")).toBeDefined();
  });
});

describe("buildMcpSettings", () => {
  it("binds the connector to the protected resource identifier", () => {
    // Arrange, Act
    const mcp = buildMcpSettings("https://www.pal-buddy.eu/mcp");

    // Assert
    expect(mcp.resource).toBe("https://www.pal-buddy.eu/mcp");
  });

  it("allows dynamic client registration with read-only default scopes only", () => {
    // Arrange, Act
    const mcp = buildMcpSettings("https://www.pal-buddy.eu/mcp");

    // Assert
    expect(mcp.allowDynamicClientRegistration).toBe(true);
    expect(mcp.clientRegistrationDefaultScopes).toEqual(["plans:read", "library:read"]);
  });

  it("lets a client request the OpenID scopes at registration, but grants only read scopes by default", () => {
    // Arrange, Act
    const mcp = buildMcpSettings("https://www.pal-buddy.eu/mcp");

    // Assert
    expect(mcp.clientRegistrationAllowedScopes).toEqual(
      expect.arrayContaining(["openid", "offline_access", "plans:read", "library:read"]),
    );
    expect(mcp.clientRegistrationDefaultScopes).not.toContain("openid");
    expect(mcp.clientRegistrationDefaultScopes).not.toContain("offline_access");
  });

  it("uses the app's own sign-in and consent pages", () => {
    // Arrange, Act
    const mcp = buildMcpSettings("https://www.pal-buddy.eu/mcp");

    // Assert
    expect(mcp.loginPage).toBe("/sign-in");
    expect(mcp.consentPage).toBe("/consent");
  });

  it("never offers a write scope", () => {
    // Arrange, Act
    const mcp = buildMcpSettings("https://www.pal-buddy.eu/mcp");

    // Assert
    expect(mcp.scopes.some((scope) => /write|update|delete/.test(scope))).toBe(false);
  });
});
