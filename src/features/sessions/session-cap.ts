import type { MoodId } from "@/features/moods/moods";
import type { SessionLengthRange } from "@/features/sessions/range";
import { MAX_MINUTES } from "@/features/sessions/session-length";

/** On these days the plan stays short: tired, stressed, and unmotivated moods. */
const GENTLE_MOODS: readonly MoodId[] = ["tired", "stressed", "unmotivated"];
export const GENTLE_MAX_MINUTES = 45;

/** The longest session allowed for a mood. With no mood chosen, the full slider range applies. */
export function maxMinutesFor(mood: MoodId | null | undefined): number {
  return mood && GENTLE_MOODS.includes(mood) ? GENTLE_MAX_MINUTES : MAX_MINUTES;
}

/** Brings the longest session down to `cap`. The shortest session is never longer than the longest. */
export function capRange(range: SessionLengthRange, cap: number): SessionLengthRange {
  if (range.maxMinutes <= cap) return range;
  return { minMinutes: Math.min(range.minMinutes, cap), maxMinutes: cap };
}
