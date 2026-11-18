"use client";

import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";

const SWEEP_SECONDS = 1.1;
const DEFAULT_BASE = "var(--foreground)";
const DEFAULT_SHINE = "var(--background)";

type ShinyTextProps = {
  children: string;
  baseColor?: string;
  shineColor?: string;
  className?: string;
};

/**
 * Text with one light sweep across it. The sweep plays when the text appears and again on hover.
 * It is a sheen on the letters, not a loop, and with reduced motion the text stays still.
 * Written for this app; the look is inspired by ReactBits' ShinyText, but no code is copied from it.
 */
export function ShinyText({
  children,
  baseColor = DEFAULT_BASE,
  shineColor = DEFAULT_SHINE,
  className,
}: ShinyTextProps) {
  const reduce = useReducedMotion();
  // Changing the key remounts the text, which replays the sweep when the pointer enters.
  const [playCount, setPlayCount] = useState(0);
  return (
    <motion.span
      key={playCount}
      onPointerEnter={() => setPlayCount((count) => count + 1)}
      initial={reduce ? false : { backgroundPosition: "150% 0%" }}
      animate={reduce ? undefined : { backgroundPosition: "-50% 0%" }}
      transition={{ duration: SWEEP_SECONDS, ease: "easeOut" }}
      className={className}
      style={{
        backgroundImage: `linear-gradient(110deg, ${baseColor} 35%, ${shineColor} 50%, ${baseColor} 65%)`,
        backgroundSize: "250% 100%",
        backgroundRepeat: "no-repeat",
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        color: "transparent",
      }}
    >
      {children}
    </motion.span>
  );
}
