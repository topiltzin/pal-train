import { describe, expect, it } from "vitest";
import { parseEnv } from "@/lib/config/env";

const validEnv = {
  BETTER_AUTH_SECRET: "a".repeat(32),
  BETTER_AUTH_URL: "http://localhost:3000",
  DATABASE_URL: "postgres://user:pass@localhost:5432/app",
  RESEND_API_KEY: "re_test_key",
  PASSWORD_RESET_FROM: "no-reply@pal-buddy.eu",
};

describe("parseEnv", () => {
  it("throws and names RESEND_API_KEY when it is missing", () => {
    // Arrange
    const source: Record<string, string | undefined> = { ...validEnv };
    delete source.RESEND_API_KEY;

    // Act / Assert
    expect(() => parseEnv(source)).toThrow(/RESEND_API_KEY/);
  });

  it("throws and names PASSWORD_RESET_FROM when it is not an email address", () => {
    // Arrange
    const source = { ...validEnv, PASSWORD_RESET_FROM: "not-an-address" };

    // Act / Assert
    expect(() => parseEnv(source)).toThrow(/PASSWORD_RESET_FROM/);
  });

  it("returns typed values when every required variable is present", () => {
    // Arrange
    const source = { ...validEnv };

    // Act
    const env = parseEnv(source);

    // Assert
    expect(env.BETTER_AUTH_URL).toBe("http://localhost:3000");
    expect(env.DATABASE_URL).toBe(validEnv.DATABASE_URL);
  });

  it("throws and names the variable when a required variable is missing", () => {
    // Arrange
    const source: Record<string, string | undefined> = { ...validEnv };
    delete source.DATABASE_URL;

    // Act / Assert
    expect(() => parseEnv(source)).toThrow(/DATABASE_URL/);
  });

  it("throws when BETTER_AUTH_SECRET is shorter than 32 characters", () => {
    // Arrange
    const source = { ...validEnv, BETTER_AUTH_SECRET: "too-short" };

    // Act / Assert
    expect(() => parseEnv(source)).toThrow(/BETTER_AUTH_SECRET/);
  });

  it("throws when BETTER_AUTH_URL is plain HTTP on a non-local host", () => {
    // Arrange
    const source = { ...validEnv, BETTER_AUTH_URL: "http://www.pal-buddy.eu" };

    // Act / Assert
    expect(() => parseEnv(source)).toThrow(/BETTER_AUTH_URL/);
  });

  it("accepts HTTPS on a public host", () => {
    // Arrange
    const source = { ...validEnv, BETTER_AUTH_URL: "https://www.pal-buddy.eu" };

    // Act
    const env = parseEnv(source);

    // Assert
    expect(env.BETTER_AUTH_URL).toBe("https://www.pal-buddy.eu");
  });

  it("does not require any Auth0 variable", () => {
    // Arrange
    const source = { ...validEnv };

    // Act / Assert
    expect(() => parseEnv(source)).not.toThrow();
  });
});
