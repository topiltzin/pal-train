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
  /** The groups picked so far. The parent enforces the limit and decides what a tap does. */
  selectedFocus: readonly FocusId[];
  onToggle: (focus: FocusId) => void;
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

const PRESS_SCALE = 0.96;
// Quick-action feedback: ease-out, under 200ms, colour and press only (no layout motion).
const PRESS_TRANSITION = { duration: 0.14, ease: [0.23, 1, 0.32, 1] as const };

/** Quick-action row: circular icon buttons with a short label, the selected one filled with the accent. */
export function FocusPicker({ focusAreas, selectedFocus, onToggle }: FocusPickerProps) {
  const reduce = useReducedMotion();
  return (
    <div role="group" aria-label="Muscle groups" className="grid grid-cols-4 gap-x-2 gap-y-5">
      {focusAreas.map((area) => {
        const isSelected = selectedFocus.includes(area.id);
        const TileIcon = FOCUS_ICONS[area.id];
        return (
          <motion.button
            key={area.id}
            type="button"
            aria-pressed={isSelected}
            title={area.description}
            onClick={() => onToggle(area.id)}
            whileTap={reduce ? undefined : { scale: PRESS_SCALE }}
            transition={PRESS_TRANSITION}
            className="flex min-w-0 flex-col items-center gap-2 text-center"
          >
            <span
              className={`flex size-14 items-center justify-center rounded-full ring-1 transition-colors duration-200 ease-out ${
                isSelected
                  ? "bg-accent text-on-accent ring-accent"
                  : "bg-surface-raised text-muted ring-line"
              }`}
            >
              <TileIcon size={24} weight="duotone" aria-hidden />
            </span>
            <span
              className={`w-full text-balance text-[11px] font-semibold leading-tight ${
                isSelected ? "text-foreground" : "text-muted"
              }`}
            >
              {area.label}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
