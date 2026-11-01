"use client";

import {
  Coffee,
  Confetti,
  Crosshair,
  Drop,
  Leaf,
  Moon,
  Sparkle,
  Wind,
  type Icon,
} from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";
import type { Mood, MoodId } from "@/features/moods/moods";

type MoodPickerProps = {
  moods: readonly Mood[];
  selectedMood: MoodId | null;
  onSelect: (mood: MoodId) => void;
};

const MOOD_ICONS: Record<MoodId, Icon> = {
  energized: Sparkle,
  tired: Moon,
  stressed: Wind,
  focused: Crosshair,
  playful: Confetti,
  unmotivated: Coffee,
  "want-to-sweat": Drop,
  calm: Leaf,
};

const PRESS_SCALE = 0.97;
const PRESS_TRANSITION = { duration: 0.16, ease: [0.23, 1, 0.32, 1] as const };
const PILL_TRANSITION = { type: "spring" as const, duration: 0.35, bounce: 0.15 };

export function MoodPicker({ moods, selectedMood, onSelect }: MoodPickerProps) {
  const reduce = useReducedMotion();
  return (
    <div
      role="group"
      aria-label="How are you feeling?"
      className="grid grid-cols-2 gap-3 md:grid-cols-4"
    >
      {moods.map((mood) => {
        const isSelected = mood.id === selectedMood;
        const TileIcon = MOOD_ICONS[mood.id];
        return (
          <motion.button
            key={mood.id}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onSelect(mood.id)}
            whileTap={reduce ? undefined : { scale: PRESS_SCALE }}
            transition={PRESS_TRANSITION}
            className="relative isolate flex items-center gap-2 overflow-hidden rounded-2xl border-2 border-black/15 bg-white px-3 py-3 text-left text-[15px] font-semibold text-black transition-colors duration-150 hover:border-black/40"
          >
            {isSelected ? (
              <motion.span
                layoutId="mood-pill"
                aria-hidden
                className="absolute inset-0 -z-10 rounded-2xl border-2 border-black"
                style={{ backgroundColor: `var(--color-${mood.accent})` }}
                transition={reduce ? { duration: 0 } : PILL_TRANSITION}
              />
            ) : null}
            <TileIcon size={20} weight="duotone" aria-hidden className="shrink-0 text-black/70" />
            <span className="whitespace-nowrap">{mood.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
