import { describe, expect, it } from "vitest";
import {
  moodAngle,
  nearestIndex,
  pointerAngle,
  settleAngle,
  unwrapStep,
} from "@/features/moods/dial-geometry";

const COUNT = 8;

describe("moodAngle", () => {
  it("places the first mood at the top of the dial", () => {
    // Act
    const angle = moodAngle(0, COUNT);

    // Assert
    expect(angle).toBe(0);
  });

  it("spaces the moods evenly clockwise around the full circle", () => {
    // Act
    const angle = moodAngle(2, COUNT);

    // Assert
    expect(angle).toBe(90);
  });
});

describe("pointerAngle", () => {
  it("reads straight up from the centre as 0 degrees", () => {
    // Act
    const angle = pointerAngle(0, -50);

    // Assert
    expect(angle).toBeCloseTo(0);
  });

  it("reads straight right of the centre as 90 degrees clockwise", () => {
    // Act
    const angle = pointerAngle(50, 0);

    // Assert
    expect(angle).toBeCloseTo(90);
  });

  it("keeps the result in the range [0, 360) for points on the left", () => {
    // Act
    const angle = pointerAngle(-50, 0);

    // Assert
    expect(angle).toBeCloseTo(270);
  });
});

describe("nearestIndex", () => {
  it("returns the mood whose slot the angle is closest to", () => {
    // Act
    const index = nearestIndex(100, COUNT);

    // Assert
    expect(index).toBe(2);
  });

  it("wraps an angle just under 360 back to the first mood", () => {
    // Act
    const index = nearestIndex(358, COUNT);

    // Assert
    expect(index).toBe(0);
  });

  it("handles negative angles from a counter-clockwise drag", () => {
    // Act
    const index = nearestIndex(-10, COUNT);

    // Assert
    expect(index).toBe(0);
  });
});

describe("unwrapStep", () => {
  it("keeps the angle continuous when crossing from 359 to 1 degrees", () => {
    // Act
    const next = unwrapStep(359, 1);

    // Assert
    expect(next).toBeCloseTo(361);
  });

  it("keeps the angle continuous when crossing back from 1 to 359 degrees", () => {
    // Act
    const next = unwrapStep(1, 359);

    // Assert
    expect(next).toBeCloseTo(-1);
  });
});

describe("settleAngle", () => {
  it("returns the nearest equivalent of the target mood slot to the current angle", () => {
    // Arrange
    const current = 350;

    // Act
    const settled = settleAngle(current, 0, COUNT);

    // Assert
    expect(settled).toBeCloseTo(360);
  });

  it("moves the short way round when the target is across the wrap point", () => {
    // Arrange
    const current = 45;

    // Act
    const settled = settleAngle(current, 7, COUNT);

    // Assert
    expect(settled).toBeCloseTo(-45);
  });
});
