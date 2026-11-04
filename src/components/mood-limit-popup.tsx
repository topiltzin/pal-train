"use client";

import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { MoodId } from "@/features/moods/moods";
import { GENTLE_MAX_MINUTES } from "@/features/sessions/session-cap";

const TITLE = "Buddy, let's take it easy";
const STICKER_PX = 112;

const MESSAGE_BY_MOOD: Partial<Record<MoodId, string>> = {
  tired: `Running on low battery today? Rest counts as progress. Keep it to ${GENTLE_MAX_MINUTES} minutes.`,
  stressed: `Let's not stack more pressure on the pressure. Keep it to ${GENTLE_MAX_MINUTES} minutes, then breathe.`,
  unmotivated: `Small steps still count. Keep it to ${GENTLE_MAX_MINUTES} minutes, and we can go again tomorrow.`,
};
const FALLBACK_MESSAGE = `Keep today's session to ${GENTLE_MAX_MINUTES} minutes or less.`;

type MoodLimitPopupProps = {
  open: boolean;
  mood: MoodId | null;
  onClose: () => void;
};

const SPRING = { type: "spring", stiffness: 380, damping: 30 } as const;

/** Explains, kindly, why the longest session stops at 45 minutes for a gentle mood. */
export function MoodLimitPopup({ open, mood, onClose }: MoodLimitPopupProps) {
  const reduce = useReducedMotion();
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return undefined;
    buttonRef.current?.focus();
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  const message = (mood && MESSAGE_BY_MOOD[mood]) || FALLBACK_MESSAGE;
  const transition = reduce ? { duration: 0 } : SPRING;

  // The popup opens from a click, so the server never needs to draw it. The portal needs the document.
  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          key="mood-limit"
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 p-5 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.2 }}
          onClick={onClose}
        >
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="mood-limit-title"
            aria-describedby="mood-limit-message"
            className="flex w-full max-w-sm flex-col items-center gap-4 rounded-3xl bg-surface-raised p-6 text-center ring-1 ring-line"
            initial={reduce ? false : { opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 8 }}
            transition={transition}
            onClick={(event) => event.stopPropagation()}
          >
            {mood ? (
              <span
                className="relative block overflow-hidden rounded-2xl"
                style={{ width: STICKER_PX, height: STICKER_PX }}
              >
                <Image
                  src={`/moods/${mood}.png`}
                  alt=""
                  fill
                  sizes={`${STICKER_PX}px`}
                  className="object-cover"
                />
              </span>
            ) : null}
            <h2 id="mood-limit-title" className="text-xl font-bold">
              {TITLE}
            </h2>
            <p id="mood-limit-message" className="text-pretty text-base text-muted">
              {message}
            </p>
            <button
              ref={buttonRef}
              type="button"
              onClick={onClose}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-accent px-6 text-sm font-semibold text-on-accent transition-[filter,transform] duration-150 ease-out hover:brightness-110 motion-safe:active:scale-[0.98]"
            >
              Sounds good
            </button>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
