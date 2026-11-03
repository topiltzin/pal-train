"use client";

import {
  Barbell,
  Crosshair,
  Flame,
  PersonArmsSpread,
  PersonSimpleTaiChi,
  PersonSimpleThrow,
  Heartbeat,
  Lightning,
  PersonSimpleRun,
  Shield,
  Target,
  Timer,
  Waves,
  type Icon,
} from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";
import type { FocusArea, FocusId } from "@/features/library/focus-areas";

type FocusPickerProps = {
  focusAreas: readonly FocusArea[];
  selectedFocus: FocusId | null;
  onSelect: (focus: FocusId | null) => void;
};

const FOCUS_ICONS: Record<FocusId, Icon> = {
  chest: Barbell,
  biceps: Lightning,
  triceps: Target,
  back: Waves,
  legs: PersonSimpleRun,
  cardio: Heartbeat,
  "hyrox-style": Timer,
  conditioning: Flame,
  calisthenics: PersonArmsSpread,
  stretching: PersonSimpleTaiChi,
  "upper-body": PersonSimpleThrow,
  shoulders: Shield,
  core: Crosshair,
};

const PRESS_SCALE = 0.97;
const PRESS_TRANSITION = { duration: 0.16, ease: [0.23, 1, 0.32, 1] as const };
// No bounce: a settled, adult motion. The highlight moves in 220ms, faster than the eye tracks.
const PILL_TRANSITION = { duration: 0.22, ease: [0.23, 1, 0.32, 1] as const };

export function FocusPicker({ focusAreas, selectedFocus, onSelect }: FocusPickerProps) {
  const reduce = useReducedMotion();
  return (
    <div role="group" aria-label="Muscle group" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {focusAreas.map((area) => {
        const isSelected = area.id === selectedFocus;
        const TileIcon = FOCUS_ICONS[area.id];
        return (
          <motion.button
            key={area.id}
            type="button"
            aria-pressed={isSelected}
            title={area.description}
            onClick={() => onSelect(isSelected ? null : area.id)}
            whileTap={reduce ? undefined : { scale: PRESS_SCALE }}
            transition={PRESS_TRANSITION}
            className="relative isolate flex flex-col items-start gap-2 overflow-hidden rounded-2xl border-2 border-black/15 bg-white px-3 py-3 text-left font-semibold"
          >
            {isSelected ? (
              <motion.span
                layoutId="focus-pill"
                aria-hidden
                className="absolute inset-0 -z-10 rounded-2xl bg-[#14161f]"
                transition={reduce ? { duration: 0 } : PILL_TRANSITION}
              />
            ) : null}
            <TileIcon
              size={22}
              weight="duotone"
              aria-hidden
              className={`shrink-0 ${isSelected ? "text-white" : "text-black/70"}`}
            />
            <span className={isSelected ? "text-white" : "text-black"}>{area.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
