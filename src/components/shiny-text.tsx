"use client";

import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";

const SWEEP_SECONDS = 1.1;
const DEFAULT_SHINE = "var(--background)";

type ShinyTextProps = {
  children: string;
  shineColor?: string;
  className?: string;
};

/**
 * Text with one light sweep across it. The sweep plays when the text appears and again on hover.
 * The text itself is never made transparent: the sheen is a separate overlay that is clear at rest,
 * so the name is always fully readable. With reduced motion the sweep does not run.
 * Written for this app; the look is inspired by ReactBits' ShinyText, but no code is copied from it.
 */
export function ShinyText({ children, shineColor = DEFAULT_SHINE, className }: ShinyTextProps) {
  const reduce = useReducedMotion();
  // Changing the key remounts the overlay, which replays the sweep when the pointer enters.
  const [playCount, setPlayCount] = useState(0);
  return (
    <span
      className={`relative inline-block ${className ?? ""}`}
      onPointerEnter={() => setPlayCount((count) => count + 1)}
    >
      {children}
      {reduce ? null : (
        <motion.span
          key={playCount}
          aria-hidden
          className="pointer-events-none absolute inset-0"
          initial={{ backgroundPosition: "150% 0%" }}
          animate={{ backgroundPosition: "-50% 0%" }}
          transition={{ duration: SWEEP_SECONDS, ease: "easeOut" }}
          style={{
            backgroundImage: `linear-gradient(110deg, transparent 35%, ${shineColor} 50%, transparent 65%)`,
            backgroundSize: "250% 100%",
            backgroundRepeat: "no-repeat",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          {children}
        </motion.span>
      )}
    </span>
  );
}
