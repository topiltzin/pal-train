"use client";

import { useCallback, useState } from "react";
import { track } from "@/features/analytics/track";
import { replacePlanExercise } from "@/features/sessions/replace-plan-exercise";
import type { SessionPlanView } from "@/features/sessions/handle-session-plan";
import type { SwapAlternatives, SwapOption } from "@/features/sessions/session-view";
import { nextAvailableOption } from "@/features/sessions/swap-cursor";
import type { LengthRange } from "@/features/sessions/swap-alternatives";

const ENDPOINT = "/api/exercise-alternatives";
const NO_CURSOR = -1;
const NO_ALTERNATIVES_TEXT = "No other exercises for this muscle group.";
const NONE_FIT_TEXT = "Every other exercise would take the session out of its length range.";
const SWAP_FAILED_TEXT = "I couldn't swap that exercise. Try again in a moment.";

type AlternativesResponse = {
  success: boolean;
  data: SwapAlternatives | null;
  error: { message: string } | null;
};

/** A short message about a card's swap, shown under that card. */
export type SwapMessage = { index: number; text: string } | null;

/** What the plan list needs to render swap controls. */
export type SwapControls = {
  swapping: boolean;
  message: SwapMessage;
  timerRunning: boolean;
  onSwap: (index: number) => void;
  /** The card's options, or null when they could not be loaded. */
  loadOptions: (index: number) => Promise<SwapOption[] | null>;
  /** Replaces the card at `index` with a chosen option. Unavailable options are ignored. */
  chooseOption: (index: number, option: SwapOption) => void;
  onTimerRunningChange: (running: boolean) => void;
};

/** The options for the card at `index`, asked of the server with the plan's current ids and range. */
async function requestAlternatives(
  plan: SessionPlanView,
  index: number,
  range: LengthRange,
): Promise<SwapAlternatives> {
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      exerciseId: plan.exercises[index].id,
      currentExerciseIds: plan.exercises.map((exercise) => exercise.id),
      ...range,
    }),
  });
  const payload = (await response.json()) as AlternativesResponse;
  if (!payload.success || !payload.data) {
    throw new Error(payload.error?.message ?? SWAP_FAILED_TEXT);
  }
  return payload.data;
}

/**
 * Swap state for one plan. Swaps are one at a time, so a second tap during a request is ignored.
 * Repeated swaps on a card move through its options (swap-cursor); a new plan clears the cursors.
 */
export function useExerciseSwaps(
  plan: SessionPlanView | null,
  setPlan: (next: SessionPlanView) => void,
  range: LengthRange,
) {
  const [cursors, setCursors] = useState<Record<number, number>>({});
  const [swapping, setSwapping] = useState(false);
  const [message, setMessage] = useState<SwapMessage>(null);
  const [timerRunning, setTimerRunning] = useState(false);

  const resetSwaps = useCallback(() => {
    setCursors({});
    setMessage(null);
  }, []);

  const swapCard = useCallback(
    async (index: number) => {
      if (!plan || swapping) return;
      const exerciseId = plan.exercises[index]?.id;
      if (!exerciseId) return;
      setSwapping(true);
      try {
        const alternatives = await requestAlternatives(plan, index, range);
        const pick = nextAvailableOption(alternatives.options, cursors[index] ?? NO_CURSOR);
        if (!pick) {
          const text = alternatives.options.length === 0 ? NO_ALTERNATIVES_TEXT : NONE_FIT_TEXT;
          setMessage({ index, text });
          return;
        }
        setPlan(replacePlanExercise(plan, exerciseId, pick.option.exercise));
        setCursors((current) => ({ ...current, [index]: pick.index }));
        setMessage(null);
        track("exercise swapped", { exerciseId, focus: alternatives.focus });
      } catch {
        setMessage({ index, text: SWAP_FAILED_TEXT });
      } finally {
        setSwapping(false);
      }
    },
    [plan, range, cursors, setPlan, swapping],
  );

  const loadOptions = useCallback(
    async (index: number): Promise<SwapOption[] | null> => {
      if (!plan) return null;
      try {
        return (await requestAlternatives(plan, index, range)).options;
      } catch {
        return null;
      }
    },
    [plan, range],
  );

  const chooseOption = useCallback(
    (index: number, option: SwapOption) => {
      const exerciseId = plan?.exercises[index]?.id;
      if (!plan || !exerciseId || !option.available) return;
      setPlan(replacePlanExercise(plan, exerciseId, option.exercise));
      setMessage(null);
      track("exercise swapped", { exerciseId, focus: option.exercise.focus });
    },
    [plan, setPlan],
  );

  const controls: SwapControls = {
    swapping,
    message,
    timerRunning,
    onSwap: (index) => void swapCard(index),
    loadOptions,
    chooseOption,
    onTimerRunningChange: setTimerRunning,
  };

  return { controls, resetSwaps };
}
