import { describe, expect, it } from "vitest";
import { nextAvailableOption } from "@/features/sessions/swap-cursor";
import type { SwapOption } from "@/features/sessions/session-view";

function option(id: string, available = true): SwapOption {
  return {
    exercise: {
      id,
      name: id,
      description: null,
      focus: "biceps",
      minutes: 5,
      intensity: "moderate",
      equipment: [],
      caution: null,
      demo: null,
    },
    available,
    unavailableReason: available ? null : "over_length",
  };
}

describe("nextAvailableOption", () => {
  it("returns the first available option when no option has been shown yet", () => {
    // Arrange
    const options = [option("a"), option("b"), option("c")];

    // Act
    const next = nextAvailableOption(options, -1);

    // Assert
    expect(next).toEqual({ option: options[0], index: 0 });
  });

  it("returns the first available option after the last index", () => {
    // Arrange
    const options = [option("a"), option("b"), option("c")];

    // Act
    const next = nextAvailableOption(options, 0);

    // Assert
    expect(next).toEqual({ option: options[1], index: 1 });
  });

  it("wraps back to the start after the last option", () => {
    // Arrange
    const options = [option("a"), option("b"), option("c")];

    // Act
    const next = nextAvailableOption(options, 2);

    // Assert
    expect(next).toEqual({ option: options[0], index: 0 });
  });

  it("skips options that are unavailable", () => {
    // Arrange
    const options = [option("a"), option("b", false), option("c")];

    // Act
    const next = nextAvailableOption(options, 0);

    // Assert
    expect(next).toEqual({ option: options[2], index: 2 });
  });

  it("returns null when no option is available", () => {
    // Arrange
    const options = [option("a", false), option("b", false)];

    // Act
    const next = nextAvailableOption(options, 0);

    // Assert
    expect(next).toBeNull();
  });

  it("never returns the same option twice in a row when two or more are available", () => {
    // Arrange
    const options = [option("a"), option("b")];
    let last = -1;
    const picked: string[] = [];

    // Act
    for (let step = 0; step < 6; step += 1) {
      const next = nextAvailableOption(options, last);
      if (!next) break;
      picked.push(next.option.exercise.id);
      last = next.index;
    }

    // Assert
    for (let step = 1; step < picked.length; step += 1) {
      expect(picked[step]).not.toBe(picked[step - 1]);
    }
  });
});
