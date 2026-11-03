import { describe, expect, it } from "vitest";
import type { Exercise } from "@/features/sessions/exercise.schema";
import { sumMinutes, toExerciseView } from "@/features/sessions/session-view";

const lowExercise: Exercise = {
  id: "legs-001",
  name: "Goblet squat",
  focus: "legs",
  moods: ["focused"],
  minutes: 8,
  intensity: "moderate",
  equipment: ["dumbbell"],
};

const highExercise: Exercise = {
  id: "back-003",
  name: "Bent-over barbell row",
  focus: "back",
  moods: ["energized"],
  minutes: 10,
  intensity: "high",
  equipment: ["barbell"],
  caution: "Keep a neutral spine.",
};

describe("toExerciseView", () => {
  it("keeps the equipment list", () => {
    expect(toExerciseView(lowExercise).equipment).toEqual(["dumbbell"]);
  });

  it("keeps the caution text for a high-intensity exercise", () => {
    expect(toExerciseView(highExercise).caution).toBe("Keep a neutral spine.");
  });

  it("sets caution to null when the exercise has none", () => {
    expect(toExerciseView(lowExercise).caution).toBeNull();
  });

  it("copies the equipment list so the library is never changed through the view", () => {
    const view = toExerciseView(lowExercise);
    view.equipment.push("changed");
    expect(lowExercise.equipment).toEqual(["dumbbell"]);
  });
});

describe("sumMinutes", () => {
  it("adds the minutes of every exercise in a plan", () => {
    expect(sumMinutes([lowExercise, highExercise])).toBe(18);
  });

  it("returns zero for an empty plan", () => {
    expect(sumMinutes([])).toBe(0);
  });
});
