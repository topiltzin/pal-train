import { describe, expect, it } from "vitest";
import { intensityLabel, intensityMeaning } from "@/features/library/intensity-label";
import { intensityLevels } from "@/features/moods/moods";

describe("intensityLabel", () => {
  it("names each level in plain words", () => {
    expect(intensityLabel("low")).toBe("Low");
    expect(intensityLabel("moderate")).toBe("Moderate");
    expect(intensityLabel("high")).toBe("High");
  });
});

describe("intensityMeaning", () => {
  it("gives every level a non-empty one-line meaning with no em-dash", () => {
    for (const level of intensityLevels) {
      const meaning = intensityMeaning(level);
      expect(meaning.length).toBeGreaterThan(0);
      expect(meaning).not.toMatch(/[—–]/);
      expect(meaning).not.toContain("\n");
    }
  });

  it("says the high level involves maximal effort or real risk", () => {
    expect(intensityMeaning("high").toLowerCase()).toMatch(/effort|risk/);
  });
});
