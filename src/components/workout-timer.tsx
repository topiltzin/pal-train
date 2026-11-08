"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import "@/features/timer/timer.css";
import { playChime, primeChime } from "@/features/timer/chime";
import { formatRemaining } from "@/features/timer/format";
import { createTimer, remainingMs, timerReducer } from "@/features/timer/timer-state";

const MS_PER_MINUTE = 60_000;
const TICK_MS = 250;
const CELEBRATION_TEXT = "Well Done, we made it today!!";

type WorkoutTimerProps = {
  /** The session's total length in minutes, from the plan. */
  totalMinutes: number;
};

type CelebrationProps = {
  onClose: () => void;
};

/** The popup content shown when the session ends. The burst is decorative and hidden from screen readers. */
function Celebration({ onClose }: CelebrationProps) {
  return (
    <div className="timer-celebration">
      <span aria-hidden className="timer-celebration__burst">
        <span className="timer-celebration__shape" />
        <span className="timer-celebration__shape" />
        <span className="timer-celebration__shape" />
        <span className="timer-celebration__shape" />
        <span className="timer-celebration__shape" />
      </span>
      <p role="status" className="timer-celebration__text">
        {CELEBRATION_TEXT}
      </p>
      <button type="button" className="timer-celebration__close" onClick={onClose}>
        Close
      </button>
    </div>
  );
}

/** A countdown for the session on screen: start, stop, finish early, and reset (spec US1 to US3). */
export function WorkoutTimer({ totalMinutes }: WorkoutTimerProps) {
  const [state, dispatch] = useReducer(timerReducer, totalMinutes * MS_PER_MINUTE, createTimer);
  const [now, setNow] = useState(() => Date.now());
  const [note, setNote] = useState("");
  const finishedByButton = useRef(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const remaining = remainingMs(state, now);
  const announcement = state.status === "finished" ? "Session complete" : note;

  // The celebration is a modal popup: open it when the session ends, close it when the timer leaves "finished".
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (state.status === "finished" && !dialog.open) {
      dialog.showModal();
    } else if (state.status !== "finished" && dialog.open) {
      dialog.close();
    }
  }, [state.status]);

  // Tick while running, and check the clock whenever the page comes back into view (research §3).
  useEffect(() => {
    if (state.status !== "running") return;
    const id = window.setInterval(() => {
      const current = Date.now();
      setNow(current);
      dispatch({ type: "tick", now: current });
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [state.status]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      const current = Date.now();
      setNow(current);
      dispatch({ type: "tick", now: current });
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  // The end of the session: the sound plays only when the clock reaches zero (contract "Sound").
  useEffect(() => {
    if (state.status === "finished" && !finishedByButton.current) {
      playChime();
    }
  }, [state.status]);

  function start() {
    primeChime();
    finishedByButton.current = false;
    const current = Date.now();
    setNow(current);
    dispatch({ type: "start", now: current });
    setNote("Timer started");
  }

  function stop() {
    const current = Date.now();
    setNow(current);
    dispatch({ type: "stop", now: current });
    setNote("Timer stopped");
  }

  function finish() {
    finishedByButton.current = true;
    dispatch({ type: "finish" });
  }

  function reset() {
    finishedByButton.current = false;
    dispatch({ type: "reset" });
    setNote("");
  }

  const buttonClass =
    "min-h-11 rounded-full px-5 text-sm font-semibold ring-1 ring-line transition-transform duration-150 ease-out active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-accent";
  const primaryClass = `${buttonClass} bg-accent text-on-accent`;

  return (
    <section aria-label="Workout timer" className="flex flex-col gap-4">
      <p className="tabular-nums text-4xl font-semibold" data-testid="timer-remaining">
        {formatRemaining(remaining)}
      </p>

      <div className="flex flex-wrap gap-3">
        {state.status === "ready" || state.status === "stopped" ? (
          <button type="button" className={primaryClass} onClick={start}>
            Start timer
          </button>
        ) : null}
        {state.status === "running" ? (
          <button type="button" className={buttonClass} onClick={stop}>
            Stop
          </button>
        ) : null}
        {state.status === "stopped" ? (
          <button type="button" className={buttonClass} onClick={reset}>
            Reset
          </button>
        ) : null}
        {state.status === "running" || state.status === "stopped" ? (
          <button type="button" className={buttonClass} onClick={finish}>
            Finish
          </button>
        ) : null}
        {state.status === "finished" ? (
          <button type="button" className={primaryClass} onClick={reset}>
            Start again
          </button>
        ) : null}
      </div>

      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>

      <dialog
        ref={dialogRef}
        aria-label="Session complete"
        className="timer-popup"
        onCancel={(event) => {
          // Escape closes the popup, the same as the Close button; the timer stays finished.
          event.preventDefault();
          dialogRef.current?.close();
        }}
      >
        {state.status === "finished" ? (
          <Celebration onClose={() => dialogRef.current?.close()} />
        ) : null}
      </dialog>
    </section>
  );
}
