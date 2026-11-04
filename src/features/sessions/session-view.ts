import type { Exercise } from "@/features/sessions/exercise.schema";
import type { FocusId } from "@/features/library/focus-areas";
import type { IntensityLevel } from "@/features/moods/moods";
import type { DemoView } from "@/features/demos/demo-link";

export type ExerciseView = {
  id: string;
  name: string;
  description: string | null;
  focus: FocusId;
  minutes: number;
  intensity: IntensityLevel;
  equipment: string[];
  caution: string | null;
  /** The active demo Short, or null. Filled in by the plan after the exercise is converted. */
  demo: DemoView | null;
};

/** The API view of an exercise. Copies arrays so callers cannot change the library. */
export function toExerciseView(exercise: Exercise): ExerciseView {
  return {
    id: exercise.id,
    name: exercise.name,
    description: exercise.description ?? null,
    focus: exercise.focus,
    minutes: exercise.minutes,
    intensity: exercise.intensity,
    equipment: [...exercise.equipment],
    caution: exercise.caution ?? null,
    demo: null,
  };
}

export function sumMinutes(exercises: readonly { minutes: number }[]): number {
  return exercises.reduce((total, exercise) => total + exercise.minutes, 0);
}
