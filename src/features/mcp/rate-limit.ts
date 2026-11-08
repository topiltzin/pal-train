/** Requests one user may make to the connector in one minute (spec FR-013). */
export const MCP_REQUESTS_PER_MINUTE = 60;

const WINDOW_MS = 60_000;

/** Storage port: increments a user's count for one window and returns the new total. */
export type RateCounter = {
  increment(userId: string, windowStart: Date): Promise<number>;
};

export type RateLimitResult = {
  allowed: boolean;
  /** Seconds until the next window starts; meaningful when `allowed` is false. */
  retryAfterSeconds: number;
};

/** Pure: the start of the one-minute window that contains `now`. */
export function windowStartFor(now: Date): Date {
  return new Date(Math.floor(now.getTime() / WINDOW_MS) * WINDOW_MS);
}

function secondsUntilNextWindow(windowStart: Date, now: Date): number {
  const remainingMs = windowStart.getTime() + WINDOW_MS - now.getTime();
  return Math.max(1, Math.ceil(remainingMs / 1000));
}

/** Counts this request and reports whether it is within the user's limit for the minute. */
export async function checkRateLimit(
  counter: RateCounter,
  userId: string,
  now: Date,
): Promise<RateLimitResult> {
  const windowStart = windowStartFor(now);
  const total = await counter.increment(userId, windowStart);
  return {
    allowed: total <= MCP_REQUESTS_PER_MINUTE,
    retryAfterSeconds: secondsUntilNextWindow(windowStart, now),
  };
}
