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
import { animate, motion, useMotionValue, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { Pip } from "@/components/pal/pip";
import { moodExpression, type PalExpression } from "@/features/pal/expressions";
import {
  moodAngle,
  nearestIndex,
  pointerAngle,
  settleAngle,
  unwrapStep,
} from "@/features/moods/dial-geometry";
import type { Mood, MoodId } from "@/features/moods/moods";

type MoodDialProps = {
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

// Geometry is set as fractions of the dial's width so the dial scales with the phone screen.
// The chip ring sits at 35% of the dial's width, which leaves room for Pip and the mood name
// in the middle. The thumb track sits just outside the chips, at 48%.
const CHIP_PX = 56;
const CHIP_RING_PCT = 35;
const TRACK_RING_PCT = 48;
const THUMB_PX = 12;
/** A press closer to the centre than this fraction of the dial's width does not start a drag. */
const CENTRE_HOLE_RATIO = 0.2;
/** A finger must move this far before a press counts as a drag rather than a tap. */
const DRAG_THRESHOLD_PX = 6;
const KEY_STEP: Partial<Record<string, number>> = {
  ArrowRight: 1,
  ArrowDown: 1,
  ArrowLeft: -1,
  ArrowUp: -1,
};
const SNAP_SECONDS = 0.22;
const SNAP_EASE = [0.23, 1, 0.32, 1] as const;
/** Pip sits in the middle of the dial. Sized to clear the chip ring on a 320px phone. */
const PIP_PX = 76;
const DEFAULT_EXPRESSION: PalExpression = "happy";
const DEFAULT_ACCENT = "var(--color-accent-sky)";

type DragState = { startX: number; startY: number; pointerId: number; dragging: boolean };

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function MoodDial({ moods, selectedMood, onSelect }: MoodDialProps) {
  const count = moods.length;
  const reduce = useReducedMotion();
  const selectedIndex = moods.findIndex((mood) => mood.id === selectedMood);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const shownIndex = previewIndex ?? selectedIndex;
  const shownMood = shownIndex >= 0 ? moods[shownIndex] : null;
  const pipExpression = shownMood ? moodExpression[shownMood.id] : DEFAULT_EXPRESSION;
  const pipAccent = shownMood ? `var(--color-${shownMood.accent})` : DEFAULT_ACCENT;

  // The finger's angle is a motion value, so a drag does not re-render React on every move.
  const angle = useMotionValue(selectedIndex >= 0 ? moodAngle(selectedIndex, count) : 0);
  const dialRef = useRef<HTMLDivElement>(null);
  const chipRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const dragRef = useRef<DragState | null>(null);

  // Move the thumb when the selection changes from outside the dial (tap, keyboard or typed mood).
  useEffect(() => {
    if (selectedIndex < 0 || dragRef.current?.dragging) return;
    const target = settleAngle(angle.get(), selectedIndex, count);
    const controls = animate(angle, target, {
      duration: reduce ? 0 : SNAP_SECONDS,
      ease: SNAP_EASE,
    });
    return () => controls.stop();
  }, [selectedIndex, count, reduce, angle]);

  function offsetFromCentre(event: PointerEvent<HTMLDivElement>) {
    const rect = dialRef.current!.getBoundingClientRect();
    return {
      dx: event.clientX - (rect.left + rect.width / 2),
      dy: event.clientY - (rect.top + rect.height / 2),
      width: rect.width,
    };
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    const { dx, dy, width } = offsetFromCentre(event);
    if (Math.hypot(dx, dy) < width * CENTRE_HOLE_RATIO) return;
    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      pointerId: event.pointerId,
      dragging: false,
    };
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag) return;
    if (!drag.dragging) {
      const moved = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY);
      if (moved < DRAG_THRESHOLD_PX) return;
      drag.dragging = true;
      // Capture only once the press is a drag, so a plain tap still reaches the chip.
      event.currentTarget.setPointerCapture(drag.pointerId);
    }
    const { dx, dy } = offsetFromCentre(event);
    angle.set(unwrapStep(angle.get(), pointerAngle(dx, dy)));
    setPreviewIndex(nearestIndex(angle.get(), count));
  }

  function handlePointerEnd() {
    const drag = dragRef.current;
    dragRef.current = null;
    setPreviewIndex(null);
    if (!drag?.dragging) return;
    const index = nearestIndex(angle.get(), count);
    animate(angle, settleAngle(angle.get(), index, count), {
      duration: reduce ? 0 : SNAP_SECONDS,
      ease: SNAP_EASE,
    });
    if (moods[index].id !== selectedMood) onSelect(moods[index].id);
  }

  function handleChipKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const step = KEY_STEP[event.key];
    if (step === undefined) return;
    event.preventDefault();
    const next = (index + step + count) % count;
    onSelect(moods[next].id);
    chipRefs.current[next]?.focus();
  }

  const rovingIndex = selectedIndex >= 0 ? selectedIndex : 0;

  return (
    <div
      ref={dialRef}
      role="group"
      aria-label="How are you feeling?"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      className="relative mx-auto aspect-square w-[min(20rem,88vw)] touch-none select-none"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute rounded-full border-2 border-black/10"
        style={{ inset: `${50 - TRACK_RING_PCT}%` }}
      />

      {moods.map((mood, index) => {
        const radians = toRadians(moodAngle(index, count));
        const x = Math.sin(radians) * CHIP_RING_PCT;
        const y = -Math.cos(radians) * CHIP_RING_PCT;
        const isSelected = index === selectedIndex;
        const isPreview = index === previewIndex && !isSelected;
        const ChipIcon = MOOD_ICONS[mood.id];
        return (
          <button
            key={mood.id}
            ref={(element) => {
              chipRefs.current[index] = element;
            }}
            type="button"
            aria-label={mood.label}
            aria-pressed={isSelected}
            tabIndex={index === rovingIndex ? 0 : -1}
            onClick={() => onSelect(mood.id)}
            onKeyDown={(event) => handleChipKey(event, index)}
            style={{
              left: `calc(50% + ${x}% - ${CHIP_PX / 2}px)`,
              top: `calc(50% + ${y}% - ${CHIP_PX / 2}px)`,
              ...(isSelected ? { backgroundColor: `var(--color-${mood.accent})` } : {}),
            }}
            className={`absolute flex size-14 items-center justify-center rounded-full border-2 bg-white transition-colors duration-150 ease-out hover:border-black/40 motion-safe:active:scale-[0.97] ${
              isSelected ? "border-black" : isPreview ? "border-black/50" : "border-black/15"
            }`}
          >
            <ChipIcon size={22} weight="duotone" aria-hidden className="text-black/80" />
          </button>
        );
      })}

      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ rotate: angle }}
      >
        <span
          className="absolute left-1/2 -translate-x-1/2 rounded-full bg-[#14161f] ring-2 ring-white"
          style={{
            width: THUMB_PX,
            height: THUMB_PX,
            top: `calc(50% - ${TRACK_RING_PCT}% - ${THUMB_PX / 2}px)`,
          }}
        />
      </motion.div>

      <div
        className="pointer-events-none absolute flex flex-col items-center justify-center gap-1 text-center"
        style={{ inset: "26%" }}
      >
        <Pip
          expression={pipExpression}
          accent={pipAccent}
          label={shownMood ? shownMood.label.toLowerCase() : "ready"}
          sizePx={PIP_PX}
        />
        <p className="text-xs font-bold leading-tight">
          {shownMood ? shownMood.label : "Pick a mood"}
        </p>
      </div>
    </div>
  );
}
