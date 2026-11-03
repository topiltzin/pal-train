import { describe, expect, it } from "vitest";
import { clampRange } from "@/features/sessions/range";

const BASE_RANGE = { minMinutes: 30, maxMinutes: 60 };

describe("clampRange", () => {
  it("pushes the maximum up when the minimum is moved above it", () => {
    // Arrange
    const current = { minMinutes: 30, maxMinutes: 45 };

    // Act
    const next = clampRange("min", 50, current);

    // Assert
    expect(next).toEqual({ minMinutes: 50, maxMinutes: 50 });
  });

  it("pushes the minimum down when the maximum is moved below it", () => {
    const next = clampRange("max", 20, BASE_RANGE);
    expect(next).toEqual({ minMinutes: 20, maxMinutes: 20 });
  });

  it("leaves the other handle alone when the move stays inside the range", () => {
    const next = clampRange("min", 35, BASE_RANGE);
    expect(next).toEqual({ minMinutes: 35, maxMinutes: 60 });
  });

  it("snaps a value to the nearest 5 minutes", () => {
    expect(clampRange("max", 47, BASE_RANGE).maxMinutes).toBe(45);
    expect(clampRange("max", 48, BASE_RANGE).maxMinutes).toBe(50);
  });

  it("clamps the maximum to 90 minutes", () => {
    expect(clampRange("max", 120, BASE_RANGE).maxMinutes).toBe(90);
  });

  it("clamps the minimum to 10 minutes", () => {
    expect(clampRange("min", 0, BASE_RANGE).minMinutes).toBe(10);
  });
});
