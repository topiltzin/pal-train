import { describe, expect, it } from "vitest";
import { loadLibrary } from "@/features/library/library-repository";
import { focusAreas } from "@/features/library/focus-areas";

const MIN_TEMPLATES_TOTAL = 100;
const MIN_TEMPLATES_PER_FOCUS = 8;

describe("template library content invariants", () => {
  it("contains at least 100 templates in total", () => {
    // Arrange
    const library = loadLibrary();

    // Act
    const total = library.list().length;

    // Assert
    expect(total).toBeGreaterThanOrEqual(MIN_TEMPLATES_TOTAL);
  });

  it("contains at least 8 templates for every focus area", () => {
    // Arrange
    const library = loadLibrary();

    // Act / Assert
    for (const focus of focusAreas) {
      expect(library.byFocus(focus.id).length, focus.id).toBeGreaterThanOrEqual(
        MIN_TEMPLATES_PER_FOCUS,
      );
    }
  });

  it("uses unique template ids across all files", () => {
    // Arrange
    const ids = loadLibrary()
      .list()
      .map((template) => template.id);

    // Act
    const unique = new Set(ids);

    // Assert
    expect(unique.size).toBe(ids.length);
  });
});
