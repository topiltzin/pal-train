import type { Mood, MoodId } from "@/features/moods/moods";

/** The card the carousel should show: the selected mood, or the first card when none is chosen. */
export function moodIndexFor(moods: readonly Mood[], selectedMood: MoodId | null): number {
  const index = moods.findIndex((mood) => mood.id === selectedMood);
  return index >= 0 ? index : 0;
}

/**
 * Whether a card change from the carousel should select a mood. The carousel starts on its
 * first card by itself, so a change only counts once the user has interacted with it.
 */
export function isUserChange(
  nextIndex: number,
  selectedIndex: number,
  interacted: boolean,
): boolean {
  return interacted && nextIndex !== selectedIndex;
}
