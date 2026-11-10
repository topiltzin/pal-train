import { describe, expect, it } from "vitest";
import { MAX_FOCUS_GROUPS, parseFocusSelection } from "@/features/sessions/focus-selection";
import { focusIds } from "@/features/library/focus-areas";

describe("parseFocusSelection", () => {
  it("turns a single id into a one-item list", () => {
    // Arrange, Act
    const result = parseFocusSelection("biceps");

    // Assert
    expect(result).toEqual({ ok: true, groups: ["biceps"] });
  });

  it("keeps the order of a list and drops duplicates, keeping the first occurrence", () => {
    // Arrange, Act
    const result = parseFocusSelection(["triceps", "biceps", "triceps"]);

    // Assert
    expect(result).toEqual({ ok: true, groups: ["triceps", "biceps"] });
  });

  it("treats a missing or empty value as no focus", () => {
    // Arrange, Act, Assert
    expect(parseFocusSelection(undefined)).toEqual({ ok: true, groups: [] });
    expect(parseFocusSelection([])).toEqual({ ok: true, groups: [] });
  });

  it("refuses a fourth group with the limit reason", () => {
    // Arrange
    const four = ["chest", "back", "legs", "core"];

    // Act
    const result = parseFocusSelection(four);

    // Assert
    expect(MAX_FOCUS_GROUPS).toBe(3);
    expect(result).toEqual({ ok: false, reason: "too_many", validIds: focusIds });
  });

  it("refuses an unknown id and lists the valid ids", () => {
    // Arrange, Act
    const result = parseFocusSelection(["elbows"]);

    // Assert
    expect(result).toEqual({ ok: false, reason: "unknown", validIds: focusIds });
  });
});
