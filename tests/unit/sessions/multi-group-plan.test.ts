import { describe, expect, it } from "vitest";
import type { Exercise } from "@/features/sessions/exercise.schema";
import { planSession } from "@/features/sessions/plan-session";

function makeExercise(id: string, focus: "biceps" | "triceps"): Exercise {
  return {
    id,
    name: `Exercise ${id}`,
    focus,
    moods: ["energized"],
    minutes: 6,
    intensity: "low",
    equipment: ["none"],
  };
}

const POOL: Exercise[] = [
  ...Array.from({ length: 8 }, (_, index) => makeExercise(`biceps-${index + 1}`, "biceps")),
  ...Array.from({ length: 8 }, (_, index) => makeExercise(`triceps-${index + 1}`, "triceps")),
];

/** Two groups, the most common case in the spec (biceps and triceps). */
const TWO_GROUPS = ["biceps", "triceps"] as const;

function planFor(focus: readonly string[], maxMinutes: number) {
  return planSession({
    exercises: POOL,
    minMinutes: 0,
    maxMinutes,
    focus: [...focus] as never,
    random: () => 0.5,
  });
}

describe("multi-group plans", () => {
  it("contains at least one exercise from each selected group (spec FR-005)", () => {
    // Arrange, Act
    const plan = planFor(TWO_GROUPS, 30);

    // Assert
    expect(plan.exercises.some((exercise) => exercise.focus === "biceps")).toBe(true);
    expect(plan.exercises.some((exercise) => exercise.focus === "triceps")).toBe(true);
  });

  it("gives each group an even share of the target count, rounded up, and never exceeds the target", () => {
    // Arrange, Act
    const plan = planFor(TWO_GROUPS, 30);
    const biceps = plan.exercises.filter((exercise) => exercise.focus === "biceps").length;
    const triceps = plan.exercises.filter((exercise) => exercise.focus === "triceps").length;

    // Assert
    const share = Math.ceil(plan.targetCount / TWO_GROUPS.length);
    expect(biceps).toBeLessThanOrEqual(share);
    expect(triceps).toBeLessThanOrEqual(share);
    expect(plan.exercises.length).toBeLessThanOrEqual(plan.targetCount);
  });

  it("keeps the total minutes within the requested maximum", () => {
    // Arrange, Act
    const plan = planFor(TWO_GROUPS, 30);

    // Assert
    expect(plan.totalMinutes).toBeLessThanOrEqual(30);
  });

  it("counts a repeated group once, so a duplicate does not change the plan", () => {
    // Arrange, Act
    const once = planFor(["biceps"], 30);
    const twice = planFor(["biceps", "biceps"], 30);

    // Assert
    expect(twice.exercises.map((exercise) => exercise.id)).toEqual(
      once.exercises.map((exercise) => exercise.id),
    );
  });
});

describe("multi-group plan size", () => {
  it("returns exercises for two groups, not an empty plan", () => {
    // Arrange, Act
    const plan = planFor(TWO_GROUPS, 30);

    // Assert
    expect(plan.exercises.length).toBeGreaterThan(0);
  });
});

describe("mixed order for several groups", () => {
  it("alternates the groups instead of listing one group's exercises first", () => {
    // Arrange, Act
    const plan = planFor(TWO_GROUPS, 30);
    const focuses = plan.exercises.map((exercise) => exercise.focus);

    // Assert
    for (let index = 1; index < focuses.length; index += 1) {
      expect(focuses[index]).not.toBe(focuses[index - 1]);
    }
  });
});
