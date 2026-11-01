"use client";

import { motion, useReducedMotion } from "motion/react";
import type { PalExpression } from "@/features/pal/expressions";

/**
 * Pip is the hand-drawn companion. The brief asks for a character, so this is the one place we
 * draw SVG by hand. Keep it simple: one body shape, a headband, and a few expression parts.
 */
const INK = "#14161f";
const BLUSH = "#ff7a95";
const SWEAT = "#7dd3fc";
const BLINK_TIMES = [0, 0.94, 0.97, 1];
const BLINK_DURATION_SECONDS = 4.2;
const BOB_DURATION_SECONDS = 2.8;

type PipProps = {
  expression: PalExpression;
  /** CSS colour for Pip's body, usually a mood accent token such as var(--color-accent-mint). */
  accent: string;
  /** Short description for screen readers, for example "excited". */
  label: string;
  sizePx?: number;
};

type Point = { x: number; y: number };

const LEFT_EYE: Point = { x: 78, y: 102 };
const RIGHT_EYE: Point = { x: 122, y: 102 };

function Eyes({ expression }: { expression: PalExpression }) {
  switch (expression) {
    case "calm":
      return <ArcEyes direction="up" />;
    case "sleepy":
      return <ArcEyes direction="down" />;
    case "focused":
    case "determined":
      return <FocusEyes />;
    case "playful":
      return <WinkEyes />;
    case "flat":
      return <LineEyes />;
    case "excited":
      return <OpenEyes radiusY={13} />;
    default:
      return <OpenEyes radiusY={11} />;
  }
}

function OpenEyes({ radiusY }: { radiusY: number }) {
  return (
    <>
      {[LEFT_EYE, RIGHT_EYE].map((eye) => (
        <g key={eye.x}>
          <ellipse cx={eye.x} cy={eye.y} rx={8.5} ry={radiusY} fill={INK} />
          <circle cx={eye.x + 3} cy={eye.y - 4} r={3} fill="#ffffff" />
        </g>
      ))}
    </>
  );
}

function ArcEyes({ direction }: { direction: "up" | "down" }) {
  const bulge = direction === "up" ? -9 : 7;
  const arc = (eye: Point) =>
    `M ${eye.x - 10} ${eye.y + 2} Q ${eye.x} ${eye.y + bulge} ${eye.x + 10} ${eye.y + 2}`;
  return (
    <>
      <path d={arc(LEFT_EYE)} stroke={INK} strokeWidth={5} strokeLinecap="round" fill="none" />
      <path d={arc(RIGHT_EYE)} stroke={INK} strokeWidth={5} strokeLinecap="round" fill="none" />
    </>
  );
}

function FocusEyes() {
  return (
    <>
      <ellipse cx={LEFT_EYE.x} cy={LEFT_EYE.y} rx={9} ry={5} fill={INK} />
      <ellipse cx={RIGHT_EYE.x} cy={RIGHT_EYE.y} rx={9} ry={5} fill={INK} />
      <path d="M 64 90 L 88 94" stroke={INK} strokeWidth={4} strokeLinecap="round" />
      <path d="M 136 90 L 112 94" stroke={INK} strokeWidth={4} strokeLinecap="round" />
    </>
  );
}

function WinkEyes() {
  return (
    <>
      <ellipse cx={LEFT_EYE.x} cy={LEFT_EYE.y} rx={8.5} ry={11} fill={INK} />
      <circle cx={LEFT_EYE.x + 3} cy={LEFT_EYE.y - 4} r={3} fill="#ffffff" />
      <path
        d={`M ${RIGHT_EYE.x - 10} ${RIGHT_EYE.y} Q ${RIGHT_EYE.x} ${RIGHT_EYE.y - 9} ${RIGHT_EYE.x + 10} ${RIGHT_EYE.y}`}
        stroke={INK}
        strokeWidth={5}
        strokeLinecap="round"
        fill="none"
      />
    </>
  );
}

function LineEyes() {
  return (
    <>
      <path
        d={`M ${LEFT_EYE.x - 9} ${LEFT_EYE.y} L ${LEFT_EYE.x + 9} ${LEFT_EYE.y}`}
        stroke={INK}
        strokeWidth={5}
        strokeLinecap="round"
      />
      <path
        d={`M ${RIGHT_EYE.x - 9} ${RIGHT_EYE.y} L ${RIGHT_EYE.x + 9} ${RIGHT_EYE.y}`}
        stroke={INK}
        strokeWidth={5}
        strokeLinecap="round"
      />
    </>
  );
}

function Mouth({ expression }: { expression: PalExpression }) {
  switch (expression) {
    case "excited":
      return <path d="M 84 128 Q 100 160 116 128 Z" fill={INK} />;
    case "playful":
      return (
        <>
          <path
            d="M 86 132 Q 100 146 114 132"
            stroke={INK}
            strokeWidth={5}
            strokeLinecap="round"
            fill="none"
          />
          <ellipse cx={104} cy={144} rx={6} ry={5} fill={BLUSH} stroke={INK} strokeWidth={3} />
        </>
      );
    case "concerned":
      return (
        <path
          d="M 88 144 Q 100 132 112 144"
          stroke={INK}
          strokeWidth={5}
          strokeLinecap="round"
          fill="none"
        />
      );
    case "determined":
      return (
        <path
          d="M 88 134 Q 104 142 116 128"
          stroke={INK}
          strokeWidth={5}
          strokeLinecap="round"
          fill="none"
        />
      );
    case "flat":
    case "sleepy":
    case "focused":
      return <path d="M 88 138 L 112 138" stroke={INK} strokeWidth={5} strokeLinecap="round" />;
    default:
      return (
        <path
          d="M 86 132 Q 100 146 114 132"
          stroke={INK}
          strokeWidth={5}
          strokeLinecap="round"
          fill="none"
        />
      );
  }
}

function Sparkle({ x, y }: Point) {
  return (
    <path
      d={`M ${x} ${y - 9} Q ${x} ${y} ${x + 9} ${y} Q ${x} ${y} ${x} ${y + 9} Q ${x} ${y} ${x - 9} ${y} Q ${x} ${y} ${x} ${y - 9} Z`}
      fill={INK}
    />
  );
}

export function Pip({ expression, accent, label, sizePx = 176 }: PipProps) {
  const reduce = useReducedMotion();
  const bob = reduce ? undefined : { y: [0, -6, 0] };
  const bobTransition = {
    duration: BOB_DURATION_SECONDS,
    repeat: Infinity,
    ease: "easeInOut" as const,
  };
  const blink = reduce ? undefined : { scaleY: [1, 1, 0.1, 1] };
  const blinkTransition = {
    duration: BLINK_DURATION_SECONDS,
    times: BLINK_TIMES,
    repeat: Infinity,
    repeatDelay: 0.4,
  };

  return (
    <svg
      viewBox="0 0 200 200"
      width={sizePx}
      height={sizePx}
      role="img"
      aria-label={`Pip, looking ${label}`}
      className="overflow-visible"
    >
      <ellipse cx={100} cy={184} rx={58} ry={8} fill={INK} opacity={0.12} />
      <motion.g animate={bob} transition={bobTransition}>
        <motion.g
          key={expression}
          initial={reduce ? false : { scaleY: 0.88, scaleX: 1.06 }}
          animate={{ scaleY: 1, scaleX: 1 }}
          transition={{ type: "spring", stiffness: 380, damping: 14 }}
          style={{ transformBox: "fill-box", transformOrigin: "50% 100%" }}
        >
          <ellipse cx={36} cy={122} rx={14} ry={22} fill={accent} stroke={INK} strokeWidth={5} />
          <ellipse cx={164} cy={122} rx={14} ry={22} fill={accent} stroke={INK} strokeWidth={5} />
          <ellipse cx={78} cy={170} rx={18} ry={11} fill={INK} />
          <ellipse cx={122} cy={170} rx={18} ry={11} fill={INK} />
          <ellipse cx={100} cy={108} rx={68} ry={64} fill={accent} stroke={INK} strokeWidth={5} />
          <ellipse
            cx={78}
            cy={78}
            rx={16}
            ry={10}
            fill="#ffffff"
            opacity={0.45}
            transform="rotate(-22 78 78)"
          />
          <path
            d="M 38 80 Q 100 58 162 80"
            stroke={INK}
            strokeWidth={12}
            strokeLinecap="round"
            fill="none"
          />
          <circle cx={62} cy={126} r={9} fill={BLUSH} opacity={0.35} />
          <circle cx={138} cy={126} r={9} fill={BLUSH} opacity={0.35} />
          <motion.g
            key={`eyes-${expression}`}
            animate={blink}
            transition={blinkTransition}
            style={{ transformBox: "fill-box", transformOrigin: "50% 50%" }}
          >
            <Eyes expression={expression} />
          </motion.g>
          <Mouth expression={expression} />
        </motion.g>
      </motion.g>

      {expression === "sleepy" ? (
        <motion.text
          x={150}
          y={56}
          fontSize={22}
          fontWeight={700}
          fill={INK}
          animate={reduce ? undefined : { y: [56, 46, 56], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        >
          z
        </motion.text>
      ) : null}
      {expression === "excited" ? (
        <motion.g
          animate={reduce ? undefined : { opacity: [0.3, 1, 0.3], scale: [0.9, 1.08, 0.9] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        >
          <Sparkle x={28} y={52} />
          <Sparkle x={172} y={44} />
        </motion.g>
      ) : null}
      {expression === "determined" ? (
        <motion.path
          d="M 152 84 Q 146 96 152 100 Q 158 96 152 84 Z"
          fill={SWEAT}
          stroke={INK}
          strokeWidth={2}
          animate={reduce ? undefined : { y: [0, 6, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeIn" }}
        />
      ) : null}
    </svg>
  );
}
