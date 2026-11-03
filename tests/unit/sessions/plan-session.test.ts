import { describe, expect, it } from "vitest";
import type { Exercise } from "@/features/sessions/exercise.schema";
import { planSession } from "@/features/sessions/plan-session";

const CHEST_POOL_SIZE = 20;

function makeExercise(overrides: Partial<Exercise> & { id: string }): Exercise {
  return {
    name: `Exercise ${overrides.id}`,
    focus: "chest",
    moods: ["energized"],
    minutes: 6,
    intensity: "low",
    equipment: ["none"],
    ...overrides,
  };
}

/** Small deterministic generator so each test controls the shuffle order. */
function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

const chestPool: Exercise[] = Array.from({ length: CHEST_POOL_SIZE }, (_, index) =>
  makeExercise({
    id: `chest-${String(index + 1).padStart(3, "0")}`,
    minutes: 5 + (index % 4),
  }),
);

describe("planSession", () => {
  it("keeps the total at or below the maximum with at least 3 exercises", () => {
    // Act
    const plan = planSession({
      exercises: chestPool,
      minMinutes: 30,
      maxMinutes: 45,
      mood: "energized",
      focus: "chest",
      random: seededRandom(1),
    });

    // Assert
    expect(plan.partial).toBe(false);
    expect(plan.exercises.length).toBeGreaterThanOrEqual(3);
    expect(plan.totalMinutes).toBeLessThanOrEqual(45);
  });

  it("never includes the same exercise twice", () => {
    const plan = planSession({
      exercises: chestPool,
      minMinutes: 30,
      maxMinutes: 60,
      mood: "energized",
      focus: "chest",
      random: seededRandom(2),
    });
    const ids = plan.exercises.map((exercise) => exercise.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("returns an empty, partial plan when no exercise fits the maximum", () => {
    const longExercises = [makeExercise({ id: "chest-001", minutes: 25 })];
    const plan = planSession({
      exercises: longExercises,
      minMinutes: 10,
      maxMinutes: 20,
      mood: "energized",
      focus: "chest",
      random: seededRandom(3),
    });
    expect(plan.exercises).toHaveLength(0);
    expect(plan.totalMinutes).toBe(0);
    expect(plan.partial).toBe(true);
  });

  it("falls back to a mood or focus match and marks the plan partial", () => {
    const backCalm = [
      makeExercise({ id: "back-001", focus: "back", moods: ["calm"], minutes: 6 }),
      makeExercise({ id: "back-002", focus: "back", moods: ["calm"], minutes: 7 }),
    ];
    const plan = planSession({
      exercises: backCalm,
      minMinutes: 10,
      maxMinutes: 30,
      mood: "calm",
      focus: "chest",
      random: seededRandom(4),
    });
    expect(plan.partial).toBe(true);
    expect(plan.exercises.length).toBeGreaterThan(0);
    expect(plan.exercises.every((exercise) => exercise.moods.includes("calm"))).toBe(true);
  });

  it("prefers exercises that match both mood and focus, and is not partial", () => {
    const mixed = [
      ...chestPool,
      makeExercise({ id: "back-001", focus: "back", moods: ["energized"], minutes: 6 }),
    ];
    const plan = planSession({
      exercises: mixed,
      minMinutes: 10,
      maxMinutes: 30,
      mood: "energized",
      focus: "chest",
      random: seededRandom(5),
    });
    expect(plan.partial).toBe(false);
    expect(plan.exercises.every((exercise) => exercise.focus === "chest")).toBe(true);
  });

  it("returns the same plan for the same inputs and random sequence", () => {
    const input = {
      exercises: chestPool,
      minMinutes: 30,
      maxMinutes: 60,
      mood: "energized" as const,
      focus: "chest" as const,
    };
    const first = planSession({ ...input, random: seededRandom(6) });
    const second = planSession({ ...input, random: seededRandom(6) });
    expect(second).toEqual(first);
  });
});

describe("planSession count scaling", () => {
  const mixedShortPool: Exercise[] = Array.from({ length: 12 }, (_, index) =>
    makeExercise({
      id: `chest-${String(index + 1).padStart(3, "0")}`,
      minutes: index % 3 === 2 ? 4 : 3,
    }),
  );
  const sixMinutePool: Exercise[] = Array.from({ length: 30 }, (_, index) =>
    makeExercise({ id: `chest-${String(index + 1).padStart(3, "0")}`, minutes: 6 }),
  );

  it("plans exactly 3 exercises at the shortest length when short exercises exist", () => {
    const plan = planSession({
      exercises: mixedShortPool,
      minMinutes: 9,
      maxMinutes: 10,
      mood: "energized",
      focus: "chest",
      random: seededRandom(8),
    });
    expect(plan.targetCount).toBe(3);
    expect(plan.exercises).toHaveLength(3);
    expect(plan.totalMinutes).toBeGreaterThanOrEqual(9);
    expect(plan.totalMinutes).toBeLessThanOrEqual(10);
  });

  it("plans exactly 10 exercises at the longest length", () => {
    const plan = planSession({
      exercises: sixMinutePool,
      minMinutes: 60,
      maxMinutes: 90,
      mood: "energized",
      focus: "chest",
      random: seededRandom(9),
    });
    expect(plan.exercises).toHaveLength(10);
    expect(plan.totalMinutes).toBe(60);
  });

  it("never plans more than 10 exercises, even to reach a longer minimum", () => {
    const shortPool = sixMinutePool.map((exercise) => ({ ...exercise, minutes: 2 }));
    const plan = planSession({
      exercises: shortPool,
      minMinutes: 80,
      maxMinutes: 90,
      mood: "energized",
      focus: "chest",
      random: seededRandom(10),
    });
    expect(plan.exercises.length).toBeLessThanOrEqual(10);
  });

  it("never decreases the number of exercises as the maximum grows", () => {
    const fiveMinutePool = sixMinutePool.map((exercise) => ({ ...exercise, minutes: 5 }));
    const counts: number[] = [];
    for (let maxMinutes = 10; maxMinutes <= 90; maxMinutes += 5) {
      const plan = planSession({
        exercises: fiveMinutePool,
        minMinutes: 10,
        maxMinutes,
        mood: "energized",
        focus: "chest",
        random: seededRandom(11),
      });
      counts.push(plan.exercises.length);
    }
    for (let index = 1; index < counts.length; index += 1) {
      expect(counts[index]).toBeGreaterThanOrEqual(counts[index - 1]);
    }
  });
});

describe("planSession minimum is driven by exercise count", () => {
  it("is not partial when three exercises fit even if the minimum minutes are not reached", () => {
    const shortPool = [1, 2, 3].map((index) =>
      makeExercise({ id: `chest-00${index}`, minutes: 2 }),
    );
    const plan = planSession({
      exercises: shortPool,
      minMinutes: 30,
      maxMinutes: 60,
      mood: "energized",
      focus: "chest",
      random: seededRandom(12),
    });
    expect(plan.exercises).toHaveLength(3);
    expect(plan.totalMinutes).toBe(6);
    expect(plan.partial).toBe(false);
  });
});
