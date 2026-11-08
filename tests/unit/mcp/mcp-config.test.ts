import { describe, expect, it } from "vitest";
import { parseMcpConfig, MCP_READ_ONLY_SCOPES } from "@/features/mcp/mcp-config";

const validSource = {
  APP_BASE_URL: "https://pal-train.vercel.app",
  AUTH0_DOMAIN: "example.us.auth0.com",
};

describe("parseMcpConfig", () => {
  it("sets the resource identifier to the app origin plus /mcp, with no trailing slash", () => {
    // Arrange
    const source = { ...validSource, APP_BASE_URL: "https://pal-train.vercel.app/" };

    // Act
    const config = parseMcpConfig(source);

    // Assert
    expect(config.resource).toBe("https://pal-train.vercel.app/mcp");
  });

  it("sets the issuer to the Auth0 domain with a trailing slash", () => {
    // Arrange, Act
    const config = parseMcpConfig(validSource);

    // Assert
    expect(config.issuer).toBe("https://example.us.auth0.com/");
  });

  it("offers only the two read-only scopes", () => {
    // Arrange, Act
    const config = parseMcpConfig(validSource);

    // Assert
    expect(config.scopesSupported).toEqual(["plans:read", "library:read"]);
    expect(MCP_READ_ONLY_SCOPES).toEqual(["plans:read", "library:read"]);
  });

  it("throws an error naming APP_BASE_URL when it is missing", () => {
    // Arrange
    const source = { AUTH0_DOMAIN: "example.us.auth0.com" };

    // Act and Assert
    expect(() => parseMcpConfig(source)).toThrow(/APP_BASE_URL/);
  });
});
