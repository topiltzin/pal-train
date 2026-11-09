import { describe, expect, it } from "vitest";
import { parseMcpConfig, MCP_READ_ONLY_SCOPES } from "@/features/mcp/mcp-config";

const validSource = {
  BETTER_AUTH_URL: "https://www.pal-buddy.eu",
};

describe("parseMcpConfig", () => {
  it("sets the resource identifier to the app origin plus /mcp, with no trailing slash", () => {
    // Arrange
    const source = { BETTER_AUTH_URL: "https://www.pal-buddy.eu/" };

    // Act
    const config = parseMcpConfig(source);

    // Assert
    expect(config.resource).toBe("https://www.pal-buddy.eu/mcp");
  });

  it("sets the issuer to the Better Auth base URL, which includes /api/auth and has no trailing slash", () => {
    // Arrange, Act
    const config = parseMcpConfig(validSource);

    // Assert
    expect(config.issuer).toBe("https://www.pal-buddy.eu/api/auth");
  });

  it("points the key set at the JWKS path under the issuer", () => {
    // Arrange, Act
    const config = parseMcpConfig(validSource);

    // Assert
    expect(config.jwksUrl).toBe("https://www.pal-buddy.eu/api/auth/jwks");
  });

  it("offers only the two read-only scopes", () => {
    // Arrange, Act
    const config = parseMcpConfig(validSource);

    // Assert
    expect(config.scopesSupported).toEqual(["plans:read", "library:read"]);
    expect(MCP_READ_ONLY_SCOPES).toEqual(["plans:read", "library:read"]);
  });

  it("throws an error naming BETTER_AUTH_URL when it is missing", () => {
    // Arrange
    const source = {};

    // Act and Assert
    expect(() => parseMcpConfig(source)).toThrow(/BETTER_AUTH_URL/);
  });
});
