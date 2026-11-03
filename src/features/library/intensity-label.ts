import type { IntensityLevel } from "@/features/moods/moods";

const LABELS: Record<IntensityLevel, string> = {
  low: "Low",
  moderate: "Moderate",
  high: "High",
};

const MEANINGS: Record<IntensityLevel, string> = {
  low: "Easy to hold a conversation. Good for recovery or a gentle start.",
  moderate: "Steady effort with some load. You can keep going, but it will feel like work.",
  high: "Maximal or near-maximal effort, or a move with real injury risk. Warm up first.",
};

export function intensityLabel(level: IntensityLevel): string {
  return LABELS[level];
}

export function intensityMeaning(level: IntensityLevel): string {
  return MEANINGS[level];
}
