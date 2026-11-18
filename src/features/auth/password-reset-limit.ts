/** Accepted reset requests allowed for one account inside the window (spec FR-010). */
export const RESET_LIMIT_PER_HOUR = 5;
/** Length of the rolling window, in minutes. */
export const RESET_WINDOW_MINUTES = 60;

const MS_PER_MINUTE = 60_000;
const RESET_WINDOW_MS = RESET_WINDOW_MINUTES * MS_PER_MINUTE;

export type ResetDecision = "accept" | "refuse";

/**
 * Pure rule for the per-account limit. A request counts only while it is strictly younger than the
 * window, so a request exactly one window old no longer counts.
 */
export function decideResetRequest(requestTimes: readonly Date[], now: Date): ResetDecision {
  const recent = requestTimes.filter((time) => now.getTime() - time.getTime() < RESET_WINDOW_MS);
  return recent.length >= RESET_LIMIT_PER_HOUR ? "refuse" : "accept";
}
