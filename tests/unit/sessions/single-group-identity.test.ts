import { describe, expect, it } from "vitest";
import baseline from "./fixtures/single-group-baseline.json";
import { loadExerciseLibrary } from "@/features/sessions/exercise-library";
import { planSession } from "@/features/sessions/plan-session";
import type { FocusId } from "@/features/library/focus-areas";
import type { MoodId } from "@/features/moods/moods";

/** The same seeded generator that produced the baseline fixture. Do not change it. */
function seeded(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type BaselineCase = {
  name: string;
  input: {
    mood: string | null;
    focus: string | null;
    minMinutes: number;
    maxMinutes: number;
    seed: number;
  };
  output: {
    exerciseIds: string[];
    totalMinutes: number;
    targetCount: number;
    partial: boolean;
    fallback: boolean;
  };
};

describe("single-group plans match the recorded baseline (spec FR-007, SC-004)", () => {
  for (const testCase of baseline as BaselineCase[]) {
    it(`keeps the plan for ${testCase.name} identical`, () => {
      // Arrange
      const { input, output } = testCase;

      // Act
      const plan = planSession({
        exercises: loadExerciseLibrary().list(),
        minMinutes: input.minMinutes,
        maxMinutes: input.maxMinutes,
        mood: (input.mood ?? undefined) as MoodId | undefined,
        focus: (input.focus ?? undefined) as FocusId | undefined,
        random: seeded(input.seed),
      });

      // Assert
      expect({
        exerciseIds: plan.exercises.map((exercise) => exercise.id),
        totalMinutes: plan.totalMinutes,
        targetCount: plan.targetCount,
        partial: plan.partial,
        fallback: plan.fallback,
      }).toEqual(output);
      expect(plan.groupNotices).toEqual([]);
    });
  }
});
