import { describe, expect, it } from "vitest";
import { browseTemplates } from "@/features/library/browse-templates";
import { loadLibrary } from "@/features/library/library-repository";

const NEW_FOCUS_IDS = ["upper-body", "shoulders", "core"] as const;
const MAX_MINUTES_FILTER = 30;

describe("browseTemplates for the new muscle group options", () => {
  it("returns only shoulder routines that match intensity and maximum length", () => {
    // Arrange
    const library = loadLibrary();

    // Act
    const result = browseTemplates(library, {
      focus: "shoulders",
      intensity: "moderate",
      maxMinutes: MAX_MINUTES_FILTER,
      limit: 50,
    });

    // Assert
    expect(result.items.length).toBeGreaterThan(0);
    for (const template of result.items) {
      expect(template.focus).toBe("shoulders");
      expect(template.intensity).toBe("moderate");
      expect(template.duration_minutes).toBeLessThanOrEqual(MAX_MINUTES_FILTER);
    }
  });

  it("finds at least one routine for each new option", () => {
    const library = loadLibrary();
    for (const focus of NEW_FOCUS_IDS) {
      expect(library.byFocus(focus).length, `focus ${focus}`).toBeGreaterThan(0);
    }
  });
});
