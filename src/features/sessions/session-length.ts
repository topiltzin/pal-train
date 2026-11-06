/**
 * Session length limits and the exercise count rule. Shared by the planner, the API, the bar,
 * and the template query so the range cannot drift between them.
 */
// The bar runs from 0. MIN_MINUTES is the floor of the exercise-count rule, not of the bar.
export const SLIDER_MIN_MINUTES = 0;
export const MIN_MINUTES = 10;
export const MAX_MINUTES = 90;
export const STEP_MINUTES = 5;
export const DEFAULT_MIN_MINUTES = SLIDER_MIN_MINUTES;
export const DEFAULT_MAX_MINUTES = 60;
export const MIN_EXERCISES = 3;
export const MAX_EXERCISES = 15;

const MINUTES_SPAN = MAX_MINUTES - MIN_MINUTES;
const EXERCISE_SPAN = MAX_EXERCISES - MIN_EXERCISES;

/**
 * Exercises planned for a session whose longest allowed length is `maxMinutes`.
 * Linear from MIN_EXERCISES at MIN_MINUTES to MAX_EXERCISES at MAX_MINUTES; never decreases.
 */
export function targetExerciseCount(maxMinutes: number): number {
  const fraction = Math.min(1, Math.max(0, (maxMinutes - MIN_MINUTES) / MINUTES_SPAN));
  return MIN_EXERCISES + Math.round(fraction * EXERCISE_SPAN);
}
