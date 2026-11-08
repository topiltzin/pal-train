const MS_PER_SECOND = 1_000;
const SECONDS_PER_MINUTE = 60;

/**
 * Remaining time as "m:ss". Partial seconds round up, so the display reads 0:00 only once the
 * time has truly run out.
 */
export function formatRemaining(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / MS_PER_SECOND));
  const minutes = Math.floor(totalSeconds / SECONDS_PER_MINUTE);
  const seconds = totalSeconds % SECONDS_PER_MINUTE;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
