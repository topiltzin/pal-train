/** How long the demo window waits for the video before showing the fallback (spec FR-008). */
export const DEMO_LOAD_TIMEOUT_MS = 10_000;

/**
 * Starts the load timer. Returns a cancel function that the window calls when the video loads
 * or the window closes; cancelling more than once is safe.
 */
export function startLoadTimeout(onTimeout: () => void): () => void {
  const timer = setTimeout(onTimeout, DEMO_LOAD_TIMEOUT_MS);
  return () => clearTimeout(timer);
}
