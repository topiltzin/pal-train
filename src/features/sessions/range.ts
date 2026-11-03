import { MAX_MINUTES, MIN_MINUTES, STEP_MINUTES } from "@/features/sessions/session-length";

export type SessionLengthRange = {
  minMinutes: number;
  maxMinutes: number;
};

export type RangeHandle = "min" | "max";

function snapToStep(value: number): number {
  const snapped = Math.round(value / STEP_MINUTES) * STEP_MINUTES;
  return Math.min(MAX_MINUTES, Math.max(MIN_MINUTES, snapped));
}

/**
 * Moves one handle to `value` (snapped and clamped), pushing the other handle along so the
 * minimum never exceeds the maximum.
 */
export function clampRange(
  handle: RangeHandle,
  value: number,
  current: SessionLengthRange,
): SessionLengthRange {
  const moved = snapToStep(value);
  if (handle === "min") {
    return { minMinutes: moved, maxMinutes: Math.max(moved, current.maxMinutes) };
  }
  return { minMinutes: Math.min(moved, current.minMinutes), maxMinutes: moved };
}
