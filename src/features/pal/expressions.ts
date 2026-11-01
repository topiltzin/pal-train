import type { MoodId } from "@/features/moods/moods";

/** The faces Pip can make. The character component draws each one. */
export const palExpressions = [
  "happy",
  "excited",
  "sleepy",
  "calm",
  "focused",
  "playful",
  "flat",
  "determined",
  "concerned",
] as const;

export type PalExpression = (typeof palExpressions)[number];

export const moodExpression: Record<MoodId, PalExpression> = {
  energized: "excited",
  tired: "sleepy",
  stressed: "concerned",
  focused: "focused",
  playful: "playful",
  unmotivated: "flat",
  "want-to-sweat": "determined",
  calm: "calm",
};
