import { describe, expect, it } from "vitest";
import { isUserChange, moodIndexFor } from "@/features/moods/carousel-selection";
import { moods } from "@/features/moods/moods";

describe("moodIndexFor", () => {
  it("returns the position of the selected mood", () => {
    // Act
    const index = moodIndexFor(moods, "stressed");

    // Assert
    expect(index).toBe(moods.findIndex((mood) => mood.id === "stressed"));
  });

  it("falls back to the first card when no mood is selected", () => {
    // Act / Assert
    expect(moodIndexFor(moods, null)).toBe(0);
  });
});

describe("isUserChange", () => {
  it("ignores the carousel's own first card before anyone touches it", () => {
    // Act / Assert: the carousel starts on card 0, which must not select Energized
    expect(isUserChange(0, -1, false)).toBe(false);
  });

  it("counts a move the user made to a different card as a selection", () => {
    // Act / Assert
    expect(isUserChange(3, 1, true)).toBe(true);
  });

  it("ignores a move to the card that is already selected", () => {
    // Act / Assert
    expect(isUserChange(2, 2, true)).toBe(false);
  });
});
