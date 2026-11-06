import { describe, expect, it } from "vitest";
import { parseAnalyticsEnv } from "@/features/analytics/analytics-env";

const validSource = {
  UMAMI_SCRIPT_URL: "https://analytics.example.com/script.js",
  UMAMI_WEBSITE_ID: "94db1cb1-74f4-4a40-ad6c-962362670409",
  ANALYTICS_HASH_SECRET: "s".repeat(32),
};

describe("parseAnalyticsEnv", () => {
  it("returns disabled when no analytics variable is set", () => {
    // Arrange
    const source = {};

    // Act
    const config = parseAnalyticsEnv(source);

    // Assert
    expect(config).toEqual({ enabled: false });
  });

  it("treats empty values as unset", () => {
    // Arrange
    const source = { UMAMI_SCRIPT_URL: "", UMAMI_WEBSITE_ID: "  ", ANALYTICS_HASH_SECRET: "" };

    // Act
    const config = parseAnalyticsEnv(source);

    // Assert
    expect(config).toEqual({ enabled: false });
  });

  it("returns the enabled config when every variable is valid", () => {
    // Arrange
    const source = { ...validSource };

    // Act
    const config = parseAnalyticsEnv(source);

    // Assert
    expect(config).toEqual({
      enabled: true,
      scriptUrl: validSource.UMAMI_SCRIPT_URL,
      websiteId: validSource.UMAMI_WEBSITE_ID,
      hashSecret: validSource.ANALYTICS_HASH_SECRET,
    });
  });

  it("throws naming the missing variables when only some are set", () => {
    // Arrange
    const source = { UMAMI_SCRIPT_URL: validSource.UMAMI_SCRIPT_URL };

    // Act and Assert
    expect(() => parseAnalyticsEnv(source)).toThrow(/UMAMI_WEBSITE_ID, ANALYTICS_HASH_SECRET/);
  });

  it("rejects a script URL that is not an absolute https URL", () => {
    // Arrange
    const source = { ...validSource, UMAMI_SCRIPT_URL: "http://analytics.example.com/script.js" };

    // Act and Assert
    expect(() => parseAnalyticsEnv(source)).toThrow(/UMAMI_SCRIPT_URL/);
  });

  it("rejects a hash secret shorter than 32 characters", () => {
    // Arrange
    const source = { ...validSource, ANALYTICS_HASH_SECRET: "short" };

    // Act and Assert
    expect(() => parseAnalyticsEnv(source)).toThrow(/ANALYTICS_HASH_SECRET/);
  });
});
