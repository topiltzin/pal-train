import { describe, expect, it } from "vitest";
import { parseEnv } from "@/lib/config/env";

const validEnv = {
  AUTH0_SECRET: "a".repeat(32),
  APP_BASE_URL: "http://localhost:3000",
  AUTH0_DOMAIN: "example.us.auth0.com",
  AUTH0_CLIENT_ID: "client-id",
  AUTH0_CLIENT_SECRET: "client-secret",
  DATABASE_URL: "postgres://user:pass@localhost:5432/app",
};

describe("parseEnv", () => {
  it("returns typed values when every required variable is present", () => {
    // Arrange
    const source = { ...validEnv };

    // Act
    const env = parseEnv(source);

    // Assert
    expect(env.AUTH0_DOMAIN).toBe("example.us.auth0.com");
    expect(env.DATABASE_URL).toBe(validEnv.DATABASE_URL);
  });

  it("throws and names the variable when a required variable is missing", () => {
    // Arrange
    const source: Record<string, string | undefined> = { ...validEnv };
    delete source.DATABASE_URL;

    // Act / Assert
    expect(() => parseEnv(source)).toThrow(/DATABASE_URL/);
  });

  it("throws when a required variable is an empty string", () => {
    // Arrange
    const source = { ...validEnv, AUTH0_CLIENT_SECRET: "" };

    // Act / Assert
    expect(() => parseEnv(source)).toThrow(/AUTH0_CLIENT_SECRET/);
  });

  it("throws when AUTH0_SECRET is shorter than 32 characters", () => {
    // Arrange
    const source = { ...validEnv, AUTH0_SECRET: "too-short" };

    // Act / Assert
    expect(() => parseEnv(source)).toThrow(/AUTH0_SECRET/);
  });
});
