"use client";

import { motion, useReducedMotion } from "motion/react";
import type { SwapOption, SwapUnavailableReason } from "@/features/sessions/session-view";

export const OVER_LENGTH_TEXT = "Would go outside your length range.";
const REASON_TEXT: Record<SwapUnavailableReason, string> = {
  over_length: OVER_LENGTH_TEXT,
};
const NO_OPTIONS_TEXT = "No other exercises for this muscle group.";
const LOADING_TEXT = "Loading other exercises...";
const LOAD_FAILED_TEXT = "I couldn't load other exercises. Try again in a moment.";
const FADE_SECONDS = 0.2;

/** Options for one card: `items` is null while loading, and `failed` is true when loading failed. */
export type OptionsState = { items: SwapOption[] | null; failed: boolean };

type ExerciseSwapOptionsProps = {
  state: OptionsState;
  onChoose: (option: SwapOption) => void;
  onClose: () => void;
};

function OptionButton({ option, onChoose }: { option: SwapOption; onChoose: () => void }) {
  const { exercise, available, unavailableReason } = option;
  return (
    <li>
      <button
        type="button"
        disabled={!available}
        onClick={onChoose}
        aria-label={`Choose ${exercise.name}`}
        className="flex w-full flex-col gap-1 rounded-xl bg-background px-3 py-2 text-left ring-1 ring-line disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-accent"
      >
        <span className="font-medium">{exercise.name}</span>
        <span className="text-sm text-muted">
          {exercise.minutes} min, {exercise.intensity} intensity
        </span>
        <span className="text-sm text-muted">{exercise.equipment.join(", ")}</span>
        {unavailableReason ? (
          <span className="text-sm text-muted">{REASON_TEXT[unavailableReason]}</span>
        ) : null}
      </button>
    </li>
  );
}

function OptionsBody({
  state,
  onChoose,
}: {
  state: OptionsState;
  onChoose: ExerciseSwapOptionsProps["onChoose"];
}) {
  if (state.failed) return <p className="text-sm text-muted">{LOAD_FAILED_TEXT}</p>;
  if (state.items === null) return <p className="text-sm text-muted">{LOADING_TEXT}</p>;
  if (state.items.length === 0) return <p className="text-sm text-muted">{NO_OPTIONS_TEXT}</p>;
  return (
    <ul className="flex flex-col gap-2">
      {state.items.map((option) => (
        <OptionButton key={option.exercise.id} option={option} onChoose={() => onChoose(option)} />
      ))}
    </ul>
  );
}

/** The same-type exercises a card can be swapped to, shown as cards under the plan card. */
export function ExerciseSwapOptions({ state, onChoose, onClose }: ExerciseSwapOptionsProps) {
  const reduce = useReducedMotion();
  return (
    <motion.section
      aria-label="Other exercises"
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: FADE_SECONDS }}
      className="flex flex-col gap-3"
    >
      <OptionsBody state={state} onChoose={onChoose} />
      <button
        type="button"
        onClick={onClose}
        className="min-h-11 self-start rounded-full px-4 text-sm font-semibold ring-1 ring-line focus-visible:outline-2 focus-visible:outline-accent"
      >
        Close
      </button>
    </motion.section>
  );
}
