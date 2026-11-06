import { describe, expect, it } from "vitest";
import type { EnabledAnalyticsConfig } from "@/features/analytics/analytics-env";
import { buildTrackerAttributes } from "@/features/analytics/tracker-attributes";

const config: EnabledAnalyticsConfig = {
  enabled: true,
  scriptUrl: "https://analytics.example.com/script.js",
  websiteId: "94db1cb1-74f4-4a40-ad6c-962362670409",
  hashSecret: "h".repeat(32),
};

describe("buildTrackerAttributes", () => {
  it("sets the website identifier", () => {
    // Arrange, Act
    const attributes = buildTrackerAttributes(config, "https://paltrain.example.com");

    // Assert
    expect(attributes["data-website-id"]).toBe(config.websiteId);
  });

  it("limits data-domains to the hostname of the app base URL", () => {
    // Arrange, Act
    const attributes = buildTrackerAttributes(config, "https://paltrain.example.com/some/path");

    // Assert
    expect(attributes["data-domains"]).toBe("paltrain.example.com");
  });

  it("uses localhost as the domain in development so local traffic is separated", () => {
    // Arrange, Act
    const attributes = buildTrackerAttributes(config, "http://localhost:3000");

    // Assert
    expect(attributes["data-domains"]).toBe("localhost");
  });

  it("honors the Do Not Track signal", () => {
    // Arrange, Act
    const attributes = buildTrackerAttributes(config, "https://paltrain.example.com");

    // Assert
    expect(attributes["data-do-not-track"]).toBe("true");
  });

  it("does not collect query strings", () => {
    // Arrange, Act
    const attributes = buildTrackerAttributes(config, "https://paltrain.example.com");

    // Assert
    expect(attributes["data-exclude-search"]).toBe("true");
  });

  it("does not set a distinct identifier on the script (identity is set after load)", () => {
    // Arrange, Act
    const attributes = buildTrackerAttributes(config, "https://paltrain.example.com");

    // Assert
    expect(attributes).not.toHaveProperty("data-distinct-id");
  });

  it("never exposes the hash secret in any attribute", () => {
    // Arrange, Act
    const attributes = buildTrackerAttributes(config, "https://paltrain.example.com");

    // Assert
    expect(Object.values(attributes).some((value) => value.includes(config.hashSecret))).toBe(
      false,
    );
  });
});
