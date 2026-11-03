import { describe, expect, it } from "vitest";
import { focusIds } from "@/features/library/focus-areas";
import { loadExerciseLibrary, parseExercises } from "@/features/sessions/exercise-library";
import { rawExerciseFiles } from "@/features/sessions/exercise-content-index";
import { moodIds } from "@/features/moods/moods";

const MIN_EXERCISES_PER_FOCUS = 10;

describe("exercise content", () => {
  it("parses every content file against the exercise schema", () => {
    // Act
    const parse = () => parseExercises(rawExerciseFiles);

    // Assert
    expect(parse).not.toThrow();
  });

  it("has at least 10 exercises for every focus area", () => {
    const library = loadExerciseLibrary();
    for (const focus of focusIds) {
      const count = library.list().filter((exercise) => exercise.focus === focus).length;
      expect(count, `focus ${focus}`).toBeGreaterThanOrEqual(MIN_EXERCISES_PER_FOCUS);
    }
  });

  it("has at least one exercise for every mood", () => {
    const exercises = loadExerciseLibrary().list();
    for (const mood of moodIds) {
      expect(
        exercises.some((exercise) => exercise.moods.includes(mood)),
        `mood ${mood}`,
      ).toBe(true);
    }
  });

  it("uses a unique id for every exercise across all files", () => {
    const ids = loadExerciseLibrary()
      .list()
      .map((exercise) => exercise.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
