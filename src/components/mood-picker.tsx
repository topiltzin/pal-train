"use client";

import type { Mood, MoodId } from "@/features/moods/moods";

type MoodPickerProps = {
  moods: readonly Mood[];
  selectedMood: MoodId | null;
  onSelect: (mood: MoodId) => void;
};

export function MoodPicker({ moods, selectedMood, onSelect }: MoodPickerProps) {
  return (
    <div role="group" aria-label="How are you feeling?" className="grid grid-cols-2 gap-3">
      {moods.map((mood) => {
        const isSelected = mood.id === selectedMood;
        return (
          <button
            key={mood.id}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onSelect(mood.id)}
            style={isSelected ? { backgroundColor: `var(--color-${mood.accent})` } : undefined}
            className={`rounded-2xl border-2 px-4 py-3 text-left font-semibold text-black transition ${
              isSelected ? "border-black" : "border-black/20 bg-white"
            }`}
          >
            {mood.label}
          </button>
        );
      })}
    </div>
  );
}
