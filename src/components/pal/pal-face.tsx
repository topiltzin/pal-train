"use client";

import { motion, useReducedMotion } from "motion/react";
import { useId } from "react";
import type { PalExpression } from "@/features/pal/expressions";

/**
 * The face layer that sits over the Pal Buddy artwork. Coordinates are in the artwork's own
 * pixels (public/pal/buddy.png is 1254 x 1254), so the features land exactly on the printed face.
 * A skin-coloured patch first covers the printed eyes and mouth, then each mood draws its own.
 */
export const ART_PIXELS = 1254;

const INK = "#14161f";
const SKIN = "#fcd6af";
const BLUSH = "#f58f8f";
const SWEAT = "#7dd3fc";
const LEFT_EYE = { x: 735, y: 357 };
const RIGHT_EYE = { x: 898, y: 357 };
const OPEN_EYE_RX = 26;
const OPEN_EYE_RY = 44;
const STROKE = 9;
const BLINK_TIMES = [0, 0.94, 0.97, 1];
const BLINK_DURATION_SECONDS = 4.2;

type Point = { x: number; y: number };

function Glint({ x, y }: Point) {
  return (
    <>
      <circle cx={x + 8} cy={y - 16} r={9} fill="#ffffff" />
      <circle cx={x - 8} cy={y + 16} r={3.5} fill="#ffffff" opacity={0.8} />
    </>
  );
}

function OpenEye({ at, ry = OPEN_EYE_RY }: { at: Point; ry?: number }) {
  return (
    <g>
      <ellipse cx={at.x} cy={at.y} rx={OPEN_EYE_RX} ry={ry} fill={INK} />
      <Glint x={at.x} y={at.y} />
    </g>
  );
}

function ArcEye({ at, direction }: { at: Point; direction: "up" | "down" }) {
  const d =
    direction === "up"
      ? `M ${at.x - 22} ${at.y + 4} Q ${at.x} ${at.y - 22} ${at.x + 22} ${at.y + 4}`
      : `M ${at.x - 22} ${at.y - 2} Q ${at.x} ${at.y + 16} ${at.x + 22} ${at.y - 2}`;
  return <path d={d} stroke={INK} strokeWidth={STROKE} strokeLinecap="round" fill="none" />;
}

function FocusEye({ at }: { at: Point }) {
  return <ellipse cx={at.x} cy={at.y} rx={27} ry={19} fill={INK} />;
}

function LineEye({ at }: { at: Point }) {
  return (
    <path
      d={`M ${at.x - 20} ${at.y} L ${at.x + 20} ${at.y}`}
      stroke={INK}
      strokeWidth={STROKE}
      strokeLinecap="round"
    />
  );
}

function Brow({ d }: { d: string }) {
  return <path d={d} stroke={INK} strokeWidth={STROKE} strokeLinecap="round" fill="none" />;
}

/** Eyes for each mood. Blinks are applied to this group only. */
function Eyes({ expression }: { expression: PalExpression }) {
  switch (expression) {
    case "excited":
      return (
        <>
          <OpenEye at={LEFT_EYE} ry={52} />
          <OpenEye at={RIGHT_EYE} ry={52} />
        </>
      );
    case "concerned":
      return (
        <>
          <OpenEye at={LEFT_EYE} ry={36} />
          <OpenEye at={RIGHT_EYE} ry={36} />
        </>
      );
    case "calm":
      return (
        <>
          <ArcEye at={LEFT_EYE} direction="up" />
          <ArcEye at={RIGHT_EYE} direction="up" />
        </>
      );
    case "sleepy":
      return (
        <>
          <ArcEye at={LEFT_EYE} direction="down" />
          <ArcEye at={RIGHT_EYE} direction="down" />
        </>
      );
    case "focused":
    case "determined":
      return (
        <>
          <FocusEye at={LEFT_EYE} />
          <FocusEye at={RIGHT_EYE} />
        </>
      );
    case "playful":
      return (
        <>
          <OpenEye at={LEFT_EYE} />
          <ArcEye at={RIGHT_EYE} direction="up" />
        </>
      );
    case "flat":
      return (
        <>
          <LineEye at={LEFT_EYE} />
          <LineEye at={RIGHT_EYE} />
        </>
      );
    default:
      return (
        <>
          <OpenEye at={LEFT_EYE} />
          <OpenEye at={RIGHT_EYE} />
        </>
      );
  }
}

/** Brows only for the moods where they carry the feeling. */
function Brows({ expression }: { expression: PalExpression }) {
  switch (expression) {
    case "focused":
      return (
        <>
          <Brow d="M 700 318 L 752 330" />
          <Brow d="M 934 318 L 882 330" />
        </>
      );
    case "determined":
      return (
        <>
          <Brow d="M 700 316 L 754 336" />
          <Brow d="M 934 316 L 880 336" />
        </>
      );
    case "concerned":
      return (
        <>
          <Brow d="M 706 324 L 756 314" />
          <Brow d="M 934 324 L 884 314" />
        </>
      );
    default:
      return null;
  }
}

function Mouth({ expression }: { expression: PalExpression }) {
  switch (expression) {
    case "excited":
      return <path d="M 790 404 Q 840 470 890 404 Z" fill={INK} />;
    case "playful":
      return (
        <>
          <path
            d="M 800 410 Q 840 440 880 410"
            stroke={INK}
            strokeWidth={STROKE}
            strokeLinecap="round"
            fill="none"
          />
          <ellipse cx={852} cy={436} rx={11} ry={9} fill={BLUSH} stroke={INK} strokeWidth={4} />
        </>
      );
    case "concerned":
      return (
        <path
          d="M 816 440 Q 840 422 864 440"
          stroke={INK}
          strokeWidth={STROKE}
          strokeLinecap="round"
          fill="none"
        />
      );
    case "determined":
      return (
        <path
          d="M 818 426 Q 846 442 874 418"
          stroke={INK}
          strokeWidth={STROKE}
          strokeLinecap="round"
          fill="none"
        />
      );
    case "calm":
      return (
        <path
          d="M 810 414 Q 840 436 870 414"
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
        <path d="M 820 430 L 860 430" stroke={INK} strokeWidth={STROKE} strokeLinecap="round" />
      );
    default:
      return (
        <path
          d="M 800 412 Q 840 444 880 412"
          stroke={INK}
          strokeWidth={STROKE}
          strokeLinecap="round"
          fill="none"
        />
      );
  }
}

/** Small extras that make a mood readable at a glance. */
function Extras({ expression }: { expression: PalExpression }) {
  if (expression === "determined") {
    return (
      <path
        d="M 1000 330 Q 990 348 1000 354 Q 1010 348 1000 330 Z"
        fill={SWEAT}
        stroke={INK}
        strokeWidth={4}
      />
    );
  }
  if (expression === "sleepy") {
    return (
      <text x={1010} y={250} fontSize={96} fontWeight={700} fill={INK}>
        z
      </text>
    );
  }
  return null;
}

export function PalFace({ expression }: { expression: PalExpression }) {
  const reduce = useReducedMotion();
  const softenId = `soften-${useId().replace(/:/g, "")}`;
  const blink = reduce ? undefined : { scaleY: [1, 1, 0.1, 1] };
  const blinkTransition = {
    duration: BLINK_DURATION_SECONDS,
    times: BLINK_TIMES,
    repeat: Infinity,
    repeatDelay: 0.4,
  };

  return (
    <svg
      viewBox={`0 0 ${ART_PIXELS} ${ART_PIXELS}`}
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden
    >
      <defs>
        <filter id={softenId} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>
      <motion.g
        key={expression}
        initial={{ scaleY: 0.96 }}
        animate={{ scaleY: 1 }}
        transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 40 }}
        style={{ transformBox: "fill-box", transformOrigin: "50% 100%" }}
      >
        <ellipse cx={800} cy={392} rx={188} ry={100} fill={SKIN} filter={`url(#${softenId})`} />
        <ellipse cx={655} cy={412} rx={26} ry={14} fill={BLUSH} opacity={0.35} />
        <ellipse cx={955} cy={412} rx={26} ry={14} fill={BLUSH} opacity={0.35} />
        <motion.g
          key={`eyes-${expression}`}
          animate={blink}
          transition={blinkTransition}
          style={{ transformBox: "fill-box", transformOrigin: "50% 50%" }}
        >
          <Eyes expression={expression} />
        </motion.g>
        <Brows expression={expression} />
        <Mouth expression={expression} />
        <Extras expression={expression} />
      </motion.g>
    </svg>
  );
}
