"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import type { CSSProperties } from "react";
import type { PalExpression } from "@/features/pal/expressions";
import { PalFace } from "@/components/pal/pal-face";

/**
 * Pip is the Pal Buddy character. The artwork in public/pal/buddy.png is the base; each mood
 * tints the character with its own colour and swaps the face drawn over the printed one.
 */
export const PAL_IMAGE_SRC = "/pal/buddy.png";
const GLOW_INSET_PX = 16;
/** Fade the colour out above the "PalBuddy" wordmark so the logo keeps its own colours. */
export const WORDMARK_FADE_START = "76%";
export const WORDMARK_FADE_END = "79%";
export const TINT_OPACITY = 0.6;

export const TINT_BY_EXPRESSION: Record<PalExpression, string> = {
  happy: "#4aa8e0",
  excited: "#f5a623",
  sleepy: "#8f7cf0",
  calm: "#3cc4a0",
  focused: "#2f6fd6",
  playful: "#ec5fa0",
  flat: "#7d8799",
  determined: "#ef5d4f",
  concerned: "#4c94a8",
};

type BobStyle = { amplitudePx: number; durationSeconds: number };

const DEFAULT_BOB: BobStyle = { amplitudePx: 6, durationSeconds: 3.2 };

const BOB_BY_EXPRESSION: Partial<Record<PalExpression, BobStyle>> = {
  excited: { amplitudePx: 10, durationSeconds: 1.8 },
  determined: { amplitudePx: 8, durationSeconds: 2.2 },
  sleepy: { amplitudePx: 3, durationSeconds: 4.2 },
  calm: { amplitudePx: 4, durationSeconds: 4.6 },
};

/** Masks the tint to the character's own silhouette, then fades it out above the wordmark. */
const TINT_MASK = `url(${PAL_IMAGE_SRC}), linear-gradient(to bottom, #000 ${WORDMARK_FADE_START}, transparent ${WORDMARK_FADE_END})`;

const tintStyle = (colour: string): CSSProperties => ({
  backgroundColor: colour,
  opacity: TINT_OPACITY,
  mixBlendMode: "color",
  maskImage: TINT_MASK,
  WebkitMaskImage: TINT_MASK,
  maskSize: "100% 100%, 100% 100%",
  WebkitMaskSize: "100% 100%, 100% 100%",
  maskRepeat: "no-repeat",
  WebkitMaskRepeat: "no-repeat",
  maskComposite: "intersect",
  WebkitMaskComposite: "source-in",
});

type PipProps = {
  expression: PalExpression;
  /** CSS colour for the glow behind Pip, usually a mood accent token such as var(--color-accent-mint). */
  accent: string;
  /** Short description for screen readers, for example "excited". */
  label: string;
  sizePx?: number;
};

export function Pip({ expression, accent, label, sizePx = 176 }: PipProps) {
  const reduce = useReducedMotion();
  const bob = BOB_BY_EXPRESSION[expression] ?? DEFAULT_BOB;

  return (
    <div
      role="img"
      aria-label={`Pip, looking ${label}`}
      className="relative"
      style={{ width: sizePx, height: sizePx }}
    >
      <span
        aria-hidden
        className="absolute rounded-full opacity-40 blur-2xl transition-colors duration-500 ease-out"
        style={{ backgroundColor: accent, inset: GLOW_INSET_PX }}
      />
      <motion.div
        className="relative h-full w-full"
        animate={reduce ? undefined : { y: [0, -bob.amplitudePx, 0] }}
        transition={{ duration: bob.durationSeconds, repeat: Infinity, ease: "easeInOut" }}
      >
        <Image
          src={PAL_IMAGE_SRC}
          alt=""
          fill
          sizes={`${sizePx}px`}
          priority
          className="object-contain"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 transition-colors duration-500 ease-out"
          style={tintStyle(TINT_BY_EXPRESSION[expression])}
        />
        <PalFace expression={expression} />
      </motion.div>
    </div>
  );
}
