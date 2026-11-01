"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import type { PalExpression } from "@/features/pal/expressions";

/**
 * Pip is the Pal Buddy character, drawn from the supplied artwork in public/pal/buddy.png.
 * The artwork has one fixed face, so the mood is expressed through the accent glow behind Pip,
 * the rhythm of his idle bob, and the speech line beside him.
 */
const PAL_IMAGE_SRC = "/pal/buddy.png";
const GLOW_INSET_PX = 16;

type BobStyle = { amplitudePx: number; durationSeconds: number };

const DEFAULT_BOB: BobStyle = { amplitudePx: 6, durationSeconds: 3.2 };

const BOB_BY_EXPRESSION: Partial<Record<PalExpression, BobStyle>> = {
  excited: { amplitudePx: 10, durationSeconds: 1.8 },
  determined: { amplitudePx: 8, durationSeconds: 2.2 },
  sleepy: { amplitudePx: 3, durationSeconds: 4.2 },
  calm: { amplitudePx: 4, durationSeconds: 4.6 },
};

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
      </motion.div>
    </div>
  );
}
