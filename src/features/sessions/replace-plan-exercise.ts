import { sumMinutes, type ExerciseView } from "@/features/sessions/session-view";

type PlanWithExercises = { exercises: ExerciseView[]; totalMinutes: number };

/**
 * Returns a copy of the plan with the entry for `exerciseId` replaced in place, and the total
 * recomputed. Returns the same plan when that id is not in it. The given plan is never changed.
 */
export function replacePlanExercise<P extends PlanWithExercises>(
  plan: P,
  exerciseId: string,
  replacement: ExerciseView,
): P {
  if (!plan.exercises.some((exercise) => exercise.id === exerciseId)) {
    return plan;
  }
  const exercises = plan.exercises.map((exercise) =>
    exercise.id === exerciseId ? replacement : exercise,
  );
  return { ...plan, exercises, totalMinutes: sumMinutes(exercises) };
}
