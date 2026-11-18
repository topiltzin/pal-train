"use client";

import { ArrowsClockwise } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";
import { useRef, useState, type RefObject } from "react";
import { ExerciseDemoButton } from "@/components/exercise-demo-button";
import { ExerciseSwapOptions, type OptionsState } from "@/components/exercise-swap-options";
import type { ExerciseView, SwapOption } from "@/features/sessions/session-view";

const FADE_SECONDS = 0.2;
const CONTROL_CLASS =
  "flex min-h-11 items-center gap-2 rounded-full bg-surface px-4 text-sm font-semibold ring-1 ring-line transition-transform duration-150 ease-out active:scale-[0.97] disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-accent";
const LOADING: OptionsState = { items: null, failed: false };

type ExerciseCardProps = {
  exercise: ExerciseView;
  /** Why swapping is unavailable right now, or null when it is available. Shown as text. */
  swapDisabledReason: string | null;
  /** A swap for this plan is in flight. Every card's controls wait for it. */
  swapping: boolean;
  /** A message about this card's last swap, or null. */
  message: string | null;
  onSwap: () => void;
  loadOptions: () => Promise<SwapOption[] | null>;
  onChoose: (option: SwapOption) => void;
};

/** The exercise's own details. Keyed by id in the card, so a swap fades the new details in. */
function ExerciseDetails({ exercise }: { exercise: ExerciseView }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      key={exercise.id}
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: FADE_SECONDS }}
      className="flex flex-col gap-1"
    >
      <div className="flex items-center justify-between gap-3">
        <span data-testid="plan-card-name" className="min-w-0 font-medium">
          {exercise.name}
        </span>
        <span data-testid="exercise-minutes" className="shrink-0 text-sm text-muted">
          {exercise.minutes}
        </span>
      </div>
      {exercise.description ? (
        <p data-testid="exercise-description" className="text-sm text-foreground/80">
          {exercise.description}
        </p>
      ) : null}
      <p data-testid="exercise-equipment" className="text-sm text-muted">
        {exercise.equipment.join(", ")}
      </p>
      {exercise.caution ? (
        <p data-testid="exercise-caution" className="text-sm text-muted">
          {exercise.caution}
        </p>
      ) : null}
      {exercise.demo ? (
        <ExerciseDemoButton
          exerciseId={exercise.id}
          exerciseName={exercise.name}
          demo={exercise.demo}
        />
      ) : null}
    </motion.div>
  );
}

type CardControlsProps = {
  exerciseName: string;
  locked: boolean;
  open: boolean;
  onSwap: () => void;
  onToggleOptions: () => void;
  chooseRef: RefObject<HTMLButtonElement | null>;
};

/** The card's two buttons. They stay mounted across swaps, so keyboard focus stays on them. */
function CardControls({
  exerciseName,
  locked,
  open,
  onSwap,
  onToggleOptions,
  chooseRef,
}: CardControlsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={onSwap}
        disabled={locked}
        aria-label={`Swap ${exerciseName}`}
        className={CONTROL_CLASS}
      >
        <ArrowsClockwise size={16} weight="bold" aria-hidden />
        Swap
      </button>
      <button
        ref={chooseRef}
        type="button"
        onClick={onToggleOptions}
        disabled={locked}
        aria-expanded={open}
        aria-label={`Choose another for ${exerciseName}`}
        className={CONTROL_CLASS}
      >
        Choose another
      </button>
    </div>
  );
}

/**
 * One exercise in a generated plan. Swap moves through this card's options in turn; "Choose
 * another" lists them so the person can pick one. Both are locked while the timer runs.
 */
export function ExerciseCard({
  exercise,
  swapDisabledReason,
  swapping,
  message,
  onSwap,
  loadOptions,
  onChoose,
}: ExerciseCardProps) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<OptionsState>(LOADING);
  const chooseTrigger = useRef<HTMLButtonElement>(null);
  const locked = swapDisabledReason !== null || swapping;
  const [wasLocked, setWasLocked] = useState(locked);

  // The options belong to the plan as it was when they were loaded, so they close as soon as the
  // card locks. Adjusting state during render avoids a separate effect and an extra render pass.
  if (locked !== wasLocked) {
    setWasLocked(locked);
    if (locked) setOpen(false);
  }

  async function openOptions() {
    setOpen(true);
    setOptions(LOADING);
    const items = await loadOptions();
    setOptions(items ? { items, failed: false } : { items: null, failed: true });
  }

  function closeOptions() {
    setOpen(false);
    chooseTrigger.current?.focus();
  }

  function swapFromCard() {
    setOpen(false);
    onSwap();
  }

  function chooseFromList(option: SwapOption) {
    setOpen(false);
    onChoose(option);
    chooseTrigger.current?.focus();
  }

  return (
    <li data-testid="plan-card" className="flex flex-col gap-3 rounded-2xl bg-surface px-4 py-3">
      <ExerciseDetails exercise={exercise} />
      <CardControls
        exerciseName={exercise.name}
        locked={locked}
        open={open}
        onSwap={swapFromCard}
        onToggleOptions={() => (open ? closeOptions() : void openOptions())}
        chooseRef={chooseTrigger}
      />
      {swapDisabledReason ? <p className="text-sm text-muted">{swapDisabledReason}</p> : null}
      {message ? (
        <p role="status" className="text-sm text-muted">
          {message}
        </p>
      ) : null}
      {open && !locked ? (
        <ExerciseSwapOptions state={options} onChoose={chooseFromList} onClose={closeOptions} />
      ) : null}
    </li>
  );
}
