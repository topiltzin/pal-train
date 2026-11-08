import { describe, expect, it } from "vitest";
import { formatRemaining } from "@/features/timer/format";

describe("formatRemaining", () => {
  it("rounds partial seconds up so the display never shows 0:00 early", () => {
    // Arrange, Act, Assert
    expect(formatRemaining(9_001)).toBe("0:10");
    expect(formatRemaining(9_000)).toBe("0:09");
  });

  it("shows seconds with two digits", () => {
    // Arrange, Act, Assert
    expect(formatRemaining(42_000)).toBe("0:42");
  });

  it("shows zero when no time remains", () => {
    // Arrange, Act, Assert
    expect(formatRemaining(0)).toBe("0:00");
  });

  it("shows a full ten-minute length", () => {
    // Arrange, Act, Assert
    expect(formatRemaining(600_000)).toBe("10:00");
  });
});
