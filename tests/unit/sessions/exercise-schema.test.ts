import { describe, expect, it } from "vitest";
import { exerciseSchema } from "@/features/sessions/exercise.schema";

const validLowExercise = {
  id: "chest-001",
  name: "Push-up",
  focus: "chest",
  moods: ["energized", "want-to-sweat"],
  minutes: 8,
  intensity: "low",
  equipment: ["none"],
};

describe("exerciseSchema", () => {
  it("accepts a valid low-intensity exercise", () => {
    const result = exerciseSchema.safeParse(validLowExercise);
    expect(result.success).toBe(true);
  });

  it("rejects a high-intensity exercise with no caution", () => {
    const result = exerciseSchema.safeParse({ ...validLowExercise, intensity: "high" });
    expect(result.success).toBe(false);
  });

  it("accepts a high-intensity exercise that has a caution", () => {
    const result = exerciseSchema.safeParse({
      ...validLowExercise,
      intensity: "high",
      caution: "Keep the spine neutral.",
    });
    expect(result.success).toBe(true);
  });

  it("rejects minutes below 1", () => {
    expect(exerciseSchema.safeParse({ ...validLowExercise, minutes: 0 }).success).toBe(false);
  });

  it("rejects minutes above 30", () => {
    expect(exerciseSchema.safeParse({ ...validLowExercise, minutes: 31 }).success).toBe(false);
  });

  it("rejects a name shorter than 3 characters", () => {
    expect(exerciseSchema.safeParse({ ...validLowExercise, name: "Up" }).success).toBe(false);
  });

  it("rejects a name longer than 60 characters", () => {
    const longName = "x".repeat(61);
    expect(exerciseSchema.safeParse({ ...validLowExercise, name: longName }).success).toBe(false);
  });

  it("rejects an empty equipment list", () => {
    expect(exerciseSchema.safeParse({ ...validLowExercise, equipment: [] }).success).toBe(false);
  });

  it("rejects an exercise with no moods", () => {
    expect(exerciseSchema.safeParse({ ...validLowExercise, moods: [] }).success).toBe(false);
  });

  it("rejects an exercise with more than 4 moods", () => {
    const moods = ["energized", "tired", "stressed", "focused", "playful"];
    expect(exerciseSchema.safeParse({ ...validLowExercise, moods }).success).toBe(false);
  });

  it("rejects an id that does not follow the focus-NNN pattern", () => {
    expect(exerciseSchema.safeParse({ ...validLowExercise, id: "chest-1" }).success).toBe(false);
  });
});
