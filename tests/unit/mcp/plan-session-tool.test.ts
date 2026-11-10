import { describe, expect, it } from "vitest";
import type { Exercise } from "@/features/sessions/exercise.schema";
import { planSession } from "@/features/sessions/plan-session";
import { planSessionTool, ToolInputError } from "@/features/mcp/tools";

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

const fixedRandom = () => 0.5;

describe("plan_session with several focus areas", () => {
  it("returns the same exercises as the app planner for the same groups and length", () => {
    // Arrange
    const focus = ["biceps", "triceps"];

    // Act
    const tool = planSessionTool(POOL, { focus, minutes: 30, random: fixedRandom });
    const app = planSession({
      exercises: POOL,
      minMinutes: 30,
      maxMinutes: 30,
      focus: focus as never,
      random: fixedRandom,
    });

    // Assert
    expect(tool.exercises.map((exercise) => exercise.id)).toEqual(
      app.exercises.map((exercise) => exercise.id),
    );
  });

  it("returns groupNotices with the plan", () => {
    // Arrange, Act
    const tool = planSessionTool(POOL, {
      focus: ["biceps", "triceps"],
      minutes: 30,
      random: fixedRandom,
    });

    // Assert
    expect(tool).toHaveProperty("groupNotices");
  });

  it("refuses a fourth group with the limit message", () => {
    // Arrange, Act
    const attempt = () =>
      planSessionTool(POOL, { focus: ["chest", "back", "legs", "core"], minutes: 30 });

    // Assert
    expect(attempt).toThrow(ToolInputError);
    expect(attempt).toThrow(/three/);
  });
});
