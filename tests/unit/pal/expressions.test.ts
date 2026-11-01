import { describe, expect, it } from "vitest";
import { moodIds } from "@/features/moods/moods";
import { moodExpression, palExpressions } from "@/features/pal/expressions";

describe("moodExpression", () => {
  it("gives every mood a known Pip expression", () => {
    // Act and Assert
    for (const mood of moodIds) {
      expect(palExpressions).toContain(moodExpression[mood]);
    }
  });

  it("gives tired and energized moods different faces", () => {
    // Act and Assert
    expect(moodExpression.tired).not.toBe(moodExpression.energized);
  });
});
