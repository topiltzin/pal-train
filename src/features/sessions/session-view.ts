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

/** Why a swap option cannot be chosen. Only length is checked; "already in plan" options are never listed. */
export type SwapUnavailableReason = "over_length";

/** One exercise a card can be swapped for, with whether choosing it keeps the plan within its range. */
export type SwapOption = {
  exercise: ExerciseView;
  available: boolean;
  unavailableReason: SwapUnavailableReason | null;
};

/** The options for one card: same muscle group, not already in the plan, in library order. */
export type SwapAlternatives = {
  exerciseId: string;
  focus: FocusId;
  options: SwapOption[];
};
