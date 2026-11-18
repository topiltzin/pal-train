import type { Exercise } from "@/features/sessions/exercise.schema";
import {
  sumMinutes,
  toExerciseView,
  type SwapOption,
  type SwapUnavailableReason,
} from "@/features/sessions/session-view";

/** The reason a swap option is unavailable because the plan would leave its length range. */
export const OVER_LENGTH_REASON: SwapUnavailableReason = "over_length";

export type LengthRange = { minMinutes: number; maxMinutes: number };

/**
 * A swap keeps the total within range. A plan already below its minimum (possible when the planner
 * could not fill the request) may not shrink further, so a swap can still improve it.
 */
function fitsRange(total: number, currentTotal: number, range: LengthRange): boolean {
  if (total > range.maxMinutes) return false;
  if (currentTotal < range.minMinutes) return total >= currentTotal;
  return total >= range.minMinutes;
}

function optionFor(
  candidate: Exercise,
  currentTotal: number,
  replacedMinutes: number,
  range: LengthRange,
): SwapOption {
  const total = currentTotal - replacedMinutes + candidate.minutes;
  const available = fitsRange(total, currentTotal, range);
  return {
    exercise: toExerciseView(candidate),
    available,
    unavailableReason: available ? null : OVER_LENGTH_REASON,
  };
}

/**
 * The same-type exercises a card can be swapped for. Minutes come from the library, never from the
 * caller. `currentIds` is the plan's exercise ids and must include `exerciseId`.
 */
export function swapOptionsFor(
  library: readonly Exercise[],
  exerciseId: string,
  currentIds: readonly string[],
  range: LengthRange,
): SwapOption[] {
  const target = library.find((exercise) => exercise.id === exerciseId);
  if (!target) return [];
  const planIds = new Set(currentIds);
  const planExercises = library.filter((exercise) => planIds.has(exercise.id));
  const currentTotal = sumMinutes(planExercises);
  return library
    .filter(
      (candidate) =>
        candidate.focus === target.focus &&
        candidate.id !== exerciseId &&
        !planIds.has(candidate.id),
    )
    .map((candidate) => optionFor(candidate, currentTotal, target.minutes, range));
}
