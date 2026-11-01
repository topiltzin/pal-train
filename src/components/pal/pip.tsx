"use client";

import { motion, useReducedMotion } from "motion/react";
import { useId } from "react";
import type { PalExpression } from "@/features/pal/expressions";

/**
 * Pip is the hand-drawn companion. The brief asks for a character, so this is the one place we
 * draw SVG by hand. One body, a sweatband, a dumbbell, brows, and a few expression parts.
 */
const INK = "#14161f";
const BLUSH = "#ff7a95";
const SWEAT = "#7dd3fc";
const BLINK_TIMES = [0, 0.94, 0.97, 1];
const BLINK_DURATION_SECONDS = 4.2;
const BOB_DURATION_SECONDS = 3.6;

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
const STROKE = 4.5;

/** Two short brows give Pip a confident, grown-up look. "Angled" reads as focus. */
function Brows({ angled }: { angled: boolean }) {
  const left = angled ? "M 64 80 L 86 88" : "M 66 84 Q 76 79 88 83";
  const right = angled ? "M 136 80 L 114 88" : "M 134 84 Q 124 79 112 83";
  return (
    <>
      <path d={left} stroke={INK} strokeWidth={4} strokeLinecap="round" fill="none" />
      <path d={right} stroke={INK} strokeWidth={4} strokeLinecap="round" fill="none" />
    </>
  );
}

function Glint({ x, y }: Point) {
  return (
    <>
      <circle cx={x + 3} cy={y - 4} r={3.4} fill="#ffffff" />
      <circle cx={x - 3} cy={y + 4} r={1.6} fill="#ffffff" opacity={0.8} />
    </>
  );
}

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
          <ellipse cx={eye.x} cy={eye.y} rx={9} ry={radiusY} fill={INK} />
          <Glint x={eye.x} y={eye.y} />
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
      <path d={arc(LEFT_EYE)} stroke={INK} strokeWidth={STROKE} strokeLinecap="round" fill="none" />
      <path
        d={arc(RIGHT_EYE)}
        stroke={INK}
        strokeWidth={STROKE}
        strokeLinecap="round"
        fill="none"
      />
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
      <ellipse cx={LEFT_EYE.x} cy={LEFT_EYE.y} rx={9} ry={11} fill={INK} />
      <Glint x={LEFT_EYE.x} y={LEFT_EYE.y} />
      <path
        d={`M ${RIGHT_EYE.x - 10} ${RIGHT_EYE.y} Q ${RIGHT_EYE.x} ${RIGHT_EYE.y - 9} ${RIGHT_EYE.x + 10} ${RIGHT_EYE.y}`}
        stroke={INK}
        strokeWidth={STROKE}
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
        strokeWidth={STROKE}
        strokeLinecap="round"
      />
      <path
        d={`M ${RIGHT_EYE.x - 9} ${RIGHT_EYE.y} L ${RIGHT_EYE.x + 9} ${RIGHT_EYE.y}`}
        stroke={INK}
        strokeWidth={STROKE}
        strokeLinecap="round"
      />
    </>
  );
}

const SMILE = "M 86 132 Q 100 146 114 132";

function Mouth({ expression }: { expression: PalExpression }) {
  switch (expression) {
    case "excited":
      return <path d="M 84 128 Q 100 160 116 128 Z" fill={INK} />;
    case "playful":
      return (
        <>
          <path d={SMILE} stroke={INK} strokeWidth={STROKE} strokeLinecap="round" fill="none" />
          <ellipse cx={104} cy={144} rx={6} ry={5} fill={BLUSH} stroke={INK} strokeWidth={3} />
        </>
      );
    case "concerned":
      return (
        <path
          d="M 88 144 Q 100 132 112 144"
          stroke={INK}
          strokeWidth={STROKE}
          strokeLinecap="round"
          fill="none"
        />
      );
    case "determined":
      return (
        <path
          d="M 88 134 Q 104 142 116 128"
          stroke={INK}
          strokeWidth={STROKE}
          strokeLinecap="round"
          fill="none"
        />
      );
    case "flat":
    case "sleepy":
    case "focused":
      return (
        <path d="M 88 138 L 112 138" stroke={INK} strokeWidth={STROKE} strokeLinecap="round" />
      );
    default:
      return <path d={SMILE} stroke={INK} strokeWidth={STROKE} strokeLinecap="round" fill="none" />;
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

/** The dumbbell Pip holds in its right hand. Drawn at the arm's end so it bobs with the body. */
function Dumbbell() {
  return (
    <g>
      <rect x={150} y={146} width={40} height={6} rx={3} fill={INK} />
      <rect x={144} y={138} width={9} height={22} rx={3} fill={INK} />
      <rect x={185} y={138} width={9} height={22} rx={3} fill={INK} />
    </g>
  );
}

export function Pip({ expression, accent, label, sizePx = 176 }: PipProps) {
  const reduce = useReducedMotion();
  const gradientId = useId().replace(/:/g, "");
  const bob = reduce ? undefined : { y: [0, -4, 0] };
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
  const shadeId = `shade-${gradientId}`;
  const glossId = `gloss-${gradientId}`;

  return (
    <svg
      viewBox="0 0 200 200"
      width={sizePx}
      height={sizePx}
      role="img"
      aria-label={`Pip, looking ${label}`}
      className="overflow-visible"
    >
      <defs>
        <radialGradient id={shadeId} cx="50%" cy="42%" r="62%">
          <stop offset="62%" stopColor={INK} stopOpacity={0} />
          <stop offset="100%" stopColor={INK} stopOpacity={0.2} />
        </radialGradient>
        <radialGradient id={glossId} cx="35%" cy="28%" r="40%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity={0.7} />
          <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
        </radialGradient>
      </defs>

      <ellipse cx={100} cy={184} rx={58} ry={8} fill={INK} opacity={0.12} />
      <motion.g animate={bob} transition={bobTransition}>
        <motion.g
          key={expression}
          initial={reduce ? false : { scaleY: 0.88, scaleX: 1.06 }}
          animate={{ scaleY: 1, scaleX: 1 }}
          transition={{ type: "spring", stiffness: 420, damping: 40 }}
          style={{ transformBox: "fill-box", transformOrigin: "50% 100%" }}
        >
          {/* Arms, feet, body */}
          <ellipse
            cx={36}
            cy={122}
            rx={14}
            ry={22}
            fill={accent}
            stroke={INK}
            strokeWidth={STROKE}
          />
          <ellipse
            cx={164}
            cy={122}
            rx={14}
            ry={22}
            fill={accent}
            stroke={INK}
            strokeWidth={STROKE}
          />
          <ellipse cx={78} cy={170} rx={18} ry={11} fill={INK} />
          <ellipse cx={122} cy={170} rx={18} ry={11} fill={INK} />
          <ellipse
            cx={100}
            cy={108}
            rx={68}
            ry={64}
            fill={accent}
            stroke={INK}
            strokeWidth={STROKE}
          />
          <ellipse cx={100} cy={108} rx={68} ry={64} fill={`url(#${shadeId})`} />
          <ellipse cx={100} cy={108} rx={68} ry={64} fill={`url(#${glossId})`} />

          {/* Headband with a little highlight */}
          <path
            d="M 38 80 Q 100 58 162 80"
            stroke={INK}
            strokeWidth={12}
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 62 74 Q 80 67 92 68"
            stroke="#ffffff"
            strokeWidth={2.5}
            strokeLinecap="round"
            fill="none"
            opacity={0.35}
          />

          <motion.g
            key={`eyes-${expression}`}
            animate={blink}
            transition={blinkTransition}
            style={{ transformBox: "fill-box", transformOrigin: "50% 50%" }}
          >
            <Eyes expression={expression} />
          </motion.g>
          {expression === "happy" || expression === "determined" ? (
            <Brows angled={expression === "determined"} />
          ) : null}
          <Mouth expression={expression} />
          <Dumbbell />
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
          <Sparkle x={24} y={56} />
          <Sparkle x={178} y={40} />
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
