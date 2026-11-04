"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DemoWindow } from "@/components/demo-dialog";
import type { DemoView } from "@/features/demos/demo-link";

type ExerciseDemoButtonProps = {
  exerciseName: string;
  demo: DemoView;
};

const DEMO_HISTORY_STATE = { demoWindow: true } as const;

/**
 * "Watch demo" for one exercise. Opening the window adds one history entry, so the browser's
 * Back action closes the window instead of leaving the page. Closing by any other route removes
 * that entry again, so the address and history are the same as before the window opened.
 */
export function ExerciseDemoButton({ exerciseName, demo }: ExerciseDemoButtonProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const hasHistoryEntry = useRef(false);
  // Set just before we remove our own entry, so the popstate that causes is not read as Back.
  const ignoreNextPopState = useRef(false);

  const finishClose = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  const closeFromWindow = useCallback(() => {
    if (hasHistoryEntry.current) {
      hasHistoryEntry.current = false;
      ignoreNextPopState.current = true;
      window.history.back();
    }
    finishClose();
  }, [finishClose]);

  const openWindow = useCallback(() => {
    if (!hasHistoryEntry.current) {
      window.history.pushState(DEMO_HISTORY_STATE, "");
      hasHistoryEntry.current = true;
    }
    setOpen(true);
  }, []);

  // Listener is always attached: an event for our own history.back() may arrive after the window
  // has already closed, and it must still be consumed by the ignore flag, not read as Back.
  useEffect(() => {
    const onPopState = () => {
      if (ignoreNextPopState.current) {
        ignoreNextPopState.current = false;
        return;
      }
      if (!hasHistoryEntry.current) return;
      hasHistoryEntry.current = false;
      finishClose();
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [finishClose]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={`Watch demo: ${exerciseName}`}
        onClick={openWindow}
        className="inline-flex min-h-11 items-center self-start rounded-full px-4 text-sm font-semibold ring-1 ring-line transition-[filter,transform] duration-150 ease-out hover:brightness-110 motion-safe:active:scale-[0.98]"
      >
        Watch demo
      </button>
      {open ? (
        <DemoWindow videoId={demo.videoId} exerciseName={exerciseName} onClose={closeFromWindow} />
      ) : null}
    </>
  );
}
