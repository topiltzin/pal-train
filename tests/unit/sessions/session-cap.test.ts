import { describe, expect, it } from "vitest";
import { capRange, GENTLE_MAX_MINUTES, maxMinutesFor } from "@/features/sessions/session-cap";
import { MAX_MINUTES } from "@/features/sessions/session-length";

describe("maxMinutesFor", () => {
  it("caps tired, stressed, and unmotivated sessions at 45 minutes", () => {
    // Act / Assert
    expect(maxMinutesFor("tired")).toBe(GENTLE_MAX_MINUTES);
    expect(maxMinutesFor("stressed")).toBe(GENTLE_MAX_MINUTES);
    expect(maxMinutesFor("unmotivated")).toBe(GENTLE_MAX_MINUTES);
    expect(GENTLE_MAX_MINUTES).toBe(45);
  });

  it("leaves every other mood at the full slider range", () => {
    // Act / Assert
    for (const mood of ["energized", "focused", "playful", "want-to-sweat", "calm"] as const) {
      expect(maxMinutesFor(mood)).toBe(MAX_MINUTES);
    }
  });

  it("leaves the full range when no mood is chosen", () => {
    // Act / Assert
    expect(maxMinutesFor(undefined)).toBe(MAX_MINUTES);
    expect(maxMinutesFor(null)).toBe(MAX_MINUTES);
  });
});

describe("capRange", () => {
  it("brings a longer maximum down to the cap and leaves the minimum alone", () => {
    // Act
    const capped = capRange({ minMinutes: 0, maxMinutes: 60 }, 45);

    // Assert
    expect(capped).toEqual({ minMinutes: 0, maxMinutes: 45 });
  });

  it("returns the same range when it is already within the cap", () => {
    // Arrange
    const range = { minMinutes: 0, maxMinutes: 30 };

    // Act / Assert
    expect(capRange(range, 45)).toEqual(range);
  });
});
