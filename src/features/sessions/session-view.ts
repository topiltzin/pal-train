import type { Exercise } from "@/features/sessions/exercise.schema";
import type { FocusId } from "@/features/library/focus-areas";
import type { IntensityLevel } from "@/features/moods/moods";

export type ExerciseView = {
  id: string;
  name: string;
  focus: FocusId;
  minutes: number;
  intensity: IntensityLevel;
  equipment: string[];
  caution: string | null;
};

/** The API view of an exercise. Copies arrays so callers cannot change the library. */
export function toExerciseView(exercise: Exercise): ExerciseView {
  return {
    id: exercise.id,
    name: exercise.name,
    focus: exercise.focus,
    minutes: exercise.minutes,
    intensity: exercise.intensity,
    equipment: [...exercise.equipment],
    caution: exercise.caution ?? null,
  };
}

export function sumMinutes(exercises: readonly { minutes: number }[]): number {
  return exercises.reduce((total, exercise) => total + exercise.minutes, 0);
}
