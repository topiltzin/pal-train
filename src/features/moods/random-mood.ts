import { moods, type Mood } from "@/features/moods/moods";

/** Picks one mood at random. `random` returns a number in [0, 1), as Math.random does. */
export function pickRandomMood(random: () => number = Math.random): Mood {
  const index = Math.min(moods.length - 1, Math.floor(random() * moods.length));
  return moods[index];
}
