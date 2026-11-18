import type { SwapOption } from "@/features/sessions/session-view";

export type CursorPick = { option: SwapOption; index: number };

/**
 * The next available option after `lastIndex`, wrapping around the list. Pass -1 when nothing has
 * been shown yet. Returns null when no option is available.
 */
export function nextAvailableOption(
  options: readonly SwapOption[],
  lastIndex: number,
): CursorPick | null {
  const count = options.length;
  for (let step = 1; step <= count; step += 1) {
    const index = (((lastIndex + step) % count) + count) % count;
    const candidate = options[index];
    if (candidate.available) {
      return { option: candidate, index };
    }
  }
  return null;
}
