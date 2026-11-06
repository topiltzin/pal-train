import { describe, expect, it } from "vitest";
import {
  DEFAULT_MAX_MINUTES,
  DEFAULT_MIN_MINUTES,
  MAX_EXERCISES,
  MAX_MINUTES,
  MIN_EXERCISES,
  MIN_MINUTES,
  SLIDER_MIN_MINUTES,
  STEP_MINUTES,
  targetExerciseCount,
} from "@/features/sessions/session-length";

describe("session length constants", () => {
  it("uses a 0 to 90 minute bar in 5-minute steps with a 0 to 60 default", () => {
    // Arrange, Act, Assert against the exported values
    expect(MIN_MINUTES).toBe(10);
    expect(SLIDER_MIN_MINUTES).toBe(0);
    expect(MAX_MINUTES).toBe(90);
    expect(STEP_MINUTES).toBe(5);
    expect(DEFAULT_MIN_MINUTES).toBe(0);
    expect(DEFAULT_MAX_MINUTES).toBe(60);
  });

  it("uses 3 to 15 exercises as the count bounds", () => {
    expect(MIN_EXERCISES).toBe(3);
    expect(MAX_EXERCISES).toBe(15);
  });
});

describe("targetExerciseCount", () => {
  it("returns 3 exercises for a 10-minute session", () => {
    expect(targetExerciseCount(10)).toBe(3);
  });

  it("returns 6 exercises for a 30-minute session", () => {
    expect(targetExerciseCount(30)).toBe(6);
  });

  it("returns 11 exercises for a 60-minute session", () => {
    expect(targetExerciseCount(60)).toBe(11);
  });

  it("returns 15 exercises for a 90-minute session", () => {
    expect(targetExerciseCount(90)).toBe(15);
  });

  it("never decreases as the maximum grows in 5-minute steps", () => {
    const counts: number[] = [];
    for (let minutes = MIN_MINUTES; minutes <= MAX_MINUTES; minutes += STEP_MINUTES) {
      counts.push(targetExerciseCount(minutes));
    }
    for (let index = 1; index < counts.length; index += 1) {
      expect(counts[index]).toBeGreaterThanOrEqual(counts[index - 1]);
    }
  });
});
