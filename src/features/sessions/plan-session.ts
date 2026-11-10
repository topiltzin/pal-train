import type { FocusId } from "@/features/library/focus-areas";
import type { MoodId } from "@/features/moods/moods";
import type { Exercise } from "@/features/sessions/exercise.schema";
import {
  MAX_EXERCISES,
  MIN_EXERCISES,
  targetExerciseCount,
} from "@/features/sessions/session-length";
import { buildGroupNotices, type GroupNotice } from "@/features/sessions/plan-notices";
import { sumMinutes } from "@/features/sessions/session-view";

export type PlanInput = {
  exercises: readonly Exercise[];
  minMinutes: number;
  maxMinutes: number;
  mood?: MoodId;
  /** One muscle group, or a list of up to three for a plan that covers each of them. */
  focus?: FocusId | readonly FocusId[];
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
  /** Muscle groups that could not be fully covered. Empty for one group or full coverage. */
  groupNotices: GroupNotice[];
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

// The count drives the plan. When the exact matches cannot reach the target count (for example one
// mood and one focus with only three exercises), closest matches fill the rest, so a longer
// request still gets a longer session instead of the same few exercises.
function needsClosestMatches(exercises: readonly Exercise[], targetCount: number): boolean {
  return exercises.length < targetCount;
}

/** A plan input that names at most one muscle group. */
type SingleGroupInput = Omit<PlanInput, "focus"> & { focus?: FocusId };

function groupsOf(focus: PlanInput["focus"]): FocusId[] {
  if (focus === undefined) return [];
  return [...new Set(typeof focus === "string" ? [focus] : focus)];
}

/** Plans a workout for the request's groups. One group or none uses the single-group rules. */
export function planSession(input: PlanInput): SessionPlan {
  const groups = groupsOf(input.focus);
  if (groups.length <= 1) {
    return planOneGroup({ ...input, focus: groups[0] });
  }
  return planGroups(input, groups);
}

/**
 * Fills each group in turn with its share of the count, while the minutes cap stays shared by
 * the whole plan. Pools are used in the order given, so earlier groups are not crowded out.
 */
function fillGroups(
  pools: Exercise[][],
  input: PlanInput,
  share: number,
  targetCount: number,
  start: readonly Exercise[] = [],
): Exercise[] {
  let chosen = [...start];
  for (const pool of pools) {
    const limit = Math.min(targetCount, chosen.length + share);
    chosen = takeUpToLimit(pool, input.maxMinutes, limit, chosen);
  }
  return topUpToMinimum(chosen, pools.flat(), input.minMinutes, input.maxMinutes);
}

/**
 * Orders the picks so the groups alternate (biceps, triceps, biceps, ...) instead of one block per
 * group. The set of exercises does not change, only their order.
 */
function interleaveByGroup(exercises: readonly Exercise[], groups: readonly FocusId[]): Exercise[] {
  const buckets = groups.map((group) => exercises.filter((exercise) => exercise.focus === group));
  const longest = Math.max(0, ...buckets.map((bucket) => bucket.length));
  const mixed: Exercise[] = [];
  for (let round = 0; round < longest; round += 1) {
    for (const bucket of buckets) {
      const exercise = bucket[round];
      if (exercise !== undefined) mixed.push(exercise);
    }
  }
  return mixed;
}

function planGroups(input: PlanInput, groups: readonly FocusId[]): SessionPlan {
  const random = input.random ?? Math.random;
  const targetCount = targetExerciseCount(input.maxMinutes);
  const share = Math.ceil(targetCount / groups.length);
  const exact = groups.map((group) =>
    shuffled(
      input.exercises.filter((exercise) => fitsBoth(exercise, input.mood, group)),
      random,
    ),
  );
  const closest = groups.map((group) =>
    shuffled(
      input.exercises.filter(
        (exercise) =>
          !fitsBoth(exercise, input.mood, group) && fitsEither(exercise, input.mood, group),
      ),
      random,
    ),
  );
  const exactPlan = fillGroups(exact, input, share, targetCount);
  const exercises = needsClosestMatches(exactPlan, targetCount)
    ? fillGroups(
        exact.map((pool, index) => [...pool, ...closest[index]]),
        input,
        share,
        targetCount,
        exactPlan,
      )
    : exactPlan;

  const totalMinutes = sumMinutes(exercises);
  const fallback = exercises.some(
    (exercise) => !groups.some((group) => fitsBoth(exercise, input.mood, group)),
  );
  const partial = exercises.length < MIN_EXERCISES;
  const available = Object.fromEntries(
    groups.map((group) => [group, input.exercises.filter((exercise) => exercise.focus === group)]),
  );
  const groupNotices = buildGroupNotices({
    groups,
    share,
    chosen: exercises,
    available,
    maxMinutes: input.maxMinutes,
  });
  return {
    exercises: interleaveByGroup(exercises, groups),
    totalMinutes,
    targetCount,
    partial,
    fallback,
    groupNotices,
  };
}

function planOneGroup(input: SingleGroupInput): SessionPlan {
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
  const exercises = needsClosestMatches(exactPlan, targetCount)
    ? fillPlan([...exact, ...closest], input, targetCount, exactPlan)
    : exactPlan;

  const totalMinutes = sumMinutes(exercises);
  const fallback = exercises.some((exercise) => !fitsBoth(exercise, input.mood, input.focus));
  // A plan is partial only when fewer than MIN_EXERCISES exercises fit. The time minimum is a best-effort target.
  const partial = exercises.length < MIN_EXERCISES;
  return { exercises, totalMinutes, targetCount, partial, fallback, groupNotices: [] };
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
