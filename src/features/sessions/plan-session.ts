import type { FocusId } from "@/features/library/focus-areas";
import type { MoodId } from "@/features/moods/moods";
import type { Exercise } from "@/features/sessions/exercise.schema";
import {
  MAX_EXERCISES,
  MIN_EXERCISES,
  targetExerciseCount,
} from "@/features/sessions/session-length";
import { sumMinutes } from "@/features/sessions/session-view";

export type PlanInput = {
  exercises: readonly Exercise[];
  minMinutes: number;
  maxMinutes: number;
  mood?: MoodId;
  focus?: FocusId;
  random?: () => number;
};

export type SessionPlan = {
  exercises: Exercise[];
  totalMinutes: number;
  targetCount: number;
  /** True when the length or count could not be met, so the plan is shorter than requested. */
  partial: boolean;
  /** True when some exercises match only the mood or only the focus, not both. */
  fallback: boolean;
};

function fitsBoth(exercise: Exercise, mood?: MoodId, focus?: FocusId): boolean {
  const moodOk = mood === undefined || exercise.moods.includes(mood);
  const focusOk = focus === undefined || exercise.focus === focus;
  return moodOk && focusOk;
}

function fitsEither(exercise: Exercise, mood?: MoodId, focus?: FocusId): boolean {
  const moodOk = mood !== undefined && exercise.moods.includes(mood);
  const focusOk = focus !== undefined && exercise.focus === focus;
  return moodOk || focusOk;
}

function shuffled(items: readonly Exercise[], random: () => number): Exercise[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

/**
 * Adds exercises in order while each one fits under the maximum, until the count limit is reached.
 * Starts from `start` so a later pass can extend an earlier one.
 */
function takeUpToLimit(
  ordered: readonly Exercise[],
  maxMinutes: number,
  limit: number,
  start: readonly Exercise[] = [],
): Exercise[] {
  const chosen = [...start];
  let total = sumMinutes(chosen);
  for (const exercise of ordered) {
    if (chosen.length >= limit) break;
    if (!chosen.includes(exercise) && total + exercise.minutes <= maxMinutes) {
      chosen.push(exercise);
      total += exercise.minutes;
    }
  }
  return chosen;
}

/** Adds fitting exercises past the count target until the minimum length is reached, never past the cap. */
function topUpToMinimum(
  chosen: readonly Exercise[],
  ordered: readonly Exercise[],
  minMinutes: number,
  maxMinutes: number,
): Exercise[] {
  const result = [...chosen];
  let total = sumMinutes(result);
  for (const exercise of ordered) {
    if (total >= minMinutes || result.length >= MAX_EXERCISES) break;
    if (!result.includes(exercise) && total + exercise.minutes <= maxMinutes) {
      result.push(exercise);
      total += exercise.minutes;
    }
  }
  return result;
}

function fillPlan(
  pool: readonly Exercise[],
  input: PlanInput,
  targetCount: number,
  start: readonly Exercise[] = [],
): Exercise[] {
  const picked = takeUpToLimit(pool, input.maxMinutes, targetCount, start);
  return topUpToMinimum(picked, pool, input.minMinutes, input.maxMinutes);
}

// The count drives the plan: fewer than MIN_EXERCISES exercises means closest matches are needed.
function needsClosestMatches(exercises: readonly Exercise[]): boolean {
  return exercises.length < MIN_EXERCISES;
}

export function planSession(input: PlanInput): SessionPlan {
  const random = input.random ?? Math.random;
  const exact = shuffled(
    input.exercises.filter((exercise) => fitsBoth(exercise, input.mood, input.focus)),
    random,
  );
  const closest = shuffled(
    input.exercises.filter(
      (exercise) =>
        !fitsBoth(exercise, input.mood, input.focus) &&
        fitsEither(exercise, input.mood, input.focus),
    ),
    random,
  );
  const targetCount = targetExerciseCount(input.maxMinutes);
  const exactPlan = fillPlan(exact, input, targetCount);
  const exercises = needsClosestMatches(exactPlan)
    ? fillPlan([...exact, ...closest], input, targetCount, exactPlan)
    : exactPlan;

  const totalMinutes = sumMinutes(exercises);
  const fallback = exercises.some(
    (exercise) => !fitsBoth(exercise, input.mood, input.focus),
  );
  // A plan is partial only when fewer than MIN_EXERCISES exercises fit. The time minimum is a best-effort target.
  const partial = exercises.length < MIN_EXERCISES;
  return { exercises, totalMinutes, targetCount, partial, fallback };
}

/**
 * The note shown with a plan: why it is shorter than asked, or that closest matches were used.
 * Null when the plan meets the request with exact matches.
 */
export function describePlanNotice(
  plan: SessionPlan,
  minMinutes: number,
  maxMinutes: number,
): string | null {
  if (plan.partial) {
    if (plan.exercises.length === 0) {
      return `No exercises fit between ${minMinutes} and ${maxMinutes} minutes. Try a wider range.`;
    }
    return `Only ${plan.exercises.length} exercises fit between ${minMinutes} and ${maxMinutes} minutes. Try a wider range.`;
  }
  if (plan.fallback) {
    return "Some exercises match only your mood or only your muscle group, so these are the closest matches.";
  }
  return null;
}
