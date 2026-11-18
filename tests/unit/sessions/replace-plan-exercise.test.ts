import { describe, expect, it } from "vitest";
import { replacePlanExercise } from "@/features/sessions/replace-plan-exercise";
import type { ExerciseView } from "@/features/sessions/session-view";

function view(id: string, minutes: number): ExerciseView {
  return {
    id,
    name: id,
    description: null,
    focus: "biceps",
    minutes,
    intensity: "moderate",
    equipment: [],
    caution: null,
    demo: null,
  };
}

function plan(exercises: ExerciseView[]) {
  return {
    exercises,
    totalMinutes: exercises.reduce((total, exercise) => total + exercise.minutes, 0),
    targetCount: exercises.length,
    partial: false,
    shortfallMessage: null,
    groupNotices: [],
  };
}

describe("replacePlanExercise", () => {
  it("replaces only the entry with the given id, keeping its position", () => {
    // Arrange
    const original = plan([view("a", 5), view("b", 8), view("c", 6)]);

    // Act
    const next = replacePlanExercise(original, "b", view("d", 7));

    // Assert
    expect(next.exercises.map((exercise) => exercise.id)).toEqual(["a", "d", "c"]);
  });

  it("recomputes totalMinutes from the new exercises", () => {
    // Arrange
    const original = plan([view("a", 5), view("b", 8)]);

    // Act
    const next = replacePlanExercise(original, "b", view("d", 3));

    // Assert
    expect(next.totalMinutes).toBe(8);
  });

  it("keeps the plan's other fields unchanged", () => {
    // Arrange
    const original = plan([view("a", 5), view("b", 8)]);

    // Act
    const next = replacePlanExercise(original, "b", view("d", 3));

    // Assert
    expect(next).toEqual(expect.objectContaining({ targetCount: 2, partial: false }));
  });

  it("does not mutate the plan it is given", () => {
    // Arrange
    const original = plan([view("a", 5), view("b", 8)]);
    const snapshot = JSON.parse(JSON.stringify(original));

    // Act
    replacePlanExercise(original, "b", view("d", 3));

    // Assert
    expect(original).toEqual(snapshot);
  });

  it("returns the same plan when the id is not in it", () => {
    // Arrange
    const original = plan([view("a", 5)]);

    // Act
    const next = replacePlanExercise(original, "zzz", view("d", 3));

    // Assert
    expect(next).toBe(original);
  });
});
