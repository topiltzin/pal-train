"use client";

/*
 * Adapted from the ReactBits "BounceCards" component (TypeScript + Tailwind registry item,
 * https://reactbits.dev/components/bounce-cards). Changes from upstream:
 * - each card takes its own `content` node instead of an image URL, so a card can hold a
 *   character drawn in code;
 * - cards take `selected` (exposed as aria-pressed) and an optional `accent` border colour;
 * - cards can be placed on explicit `slots` (a grid), not only on the default fan;
 * - a click or hover finds the nearest card in two dimensions, so grid rows hit-test correctly.
 */

import React, { useEffect, useRef } from "react";

export type BounceCardItem = {
  label: string;
  content: React.ReactNode;
  selected?: boolean;
  accent?: string;
};

export type BounceCardSlot = { x: number; y: number; rotate: number };

export type BounceCardsProps = {
  items: BounceCardItem[];
  slots?: BounceCardSlot[];
  className?: string;
  style?: React.CSSProperties;
  containerWidth?: number;
  containerHeight?: number;
  cardSize?: number;
  spread?: number;
  rotation?: number;
  arc?: number;
  animationDelay?: number;
  animationStagger?: number;
  bounciness?: number;
  enableHover?: boolean;
  pushDistance?: number;
  hoverScale?: number;
  borderWidth?: number;
  borderColor?: string;
  radius?: number;
  shadow?: boolean;
  onCardClick?: (index: number) => void;
};

type Body = {
  x: number;
  y: number;
  rotate: number;
  scale: number;
  vx: number;
  vy: number;
  vr: number;
  vs: number;
  born: number;
};

const ROOT = "relative touch-pan-y [-webkit-tap-highlight-color:transparent]";
const CARD =
  "absolute top-1/2 left-1/2 aspect-square w-[var(--bounce-cards-size)] overflow-hidden rounded-[var(--bounce-cards-radius)] border-[length:var(--bounce-cards-border)] border-solid border-[color:var(--bounce-cards-border-color)] [background:var(--bounce-cards-border-color)] [box-shadow:var(--bounce-cards-shadow)] [transform:translate(-50%,-50%)_scale(0)] transition-[box-shadow,border-color] duration-300 will-change-transform data-[active]:[box-shadow:var(--bounce-cards-shadow-active)]";
const CLICKABLE =
  "cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[color:var(--bounce-cards-border-color)]";

const PATTERN = [1, 0.5, -0.3, -1, 0.2, 0.75, -0.6, 0.35, -0.85, 0.1];
/** A pointer this far outside a card's edge does not count as touching it. */
const HIT_SLOP_PX = 12;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export default function BounceCards({
  items,
  slots: customSlots,
  className = "",
  style,
  containerWidth = 400,
  containerHeight = 400,
  cardSize = 200,
  spread = 85,
  rotation = 10,
  arc = 0,
  animationDelay = 0.5,
  animationStagger = 0.06,
  bounciness = 0.6,
  enableHover = true,
  pushDistance = 160,
  hoverScale = 1.06,
  borderWidth = 5,
  borderColor = "#ffffff",
  radius = 25,
  shadow = true,
  onCardClick,
}: BounceCardsProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const wakeRef = useRef<(() => void) | null>(null);
  const count = items.length;
  const middle = (count - 1) / 2;
  const reach = Math.max(1, middle);
  const slots: BounceCardSlot[] = items.map((_, i) => {
    if (customSlots?.[i]) return customSlots[i];
    const offset = i - middle;
    return {
      x: offset * spread,
      y: arc * (offset / reach) ** 2,
      rotate: rotation * PATTERN[i % PATTERN.length],
    };
  });
  const settings = {
    slots,
    cardSize: Math.max(10, cardSize),
    delay: Math.max(0, animationDelay),
    stagger: Math.max(0, animationStagger),
    bounciness: clamp(bounciness, 0, 1),
    enableHover,
    pushDistance,
    hoverScale: clamp(hoverScale, 0.5, 2),
    clickable: typeof onCardClick === "function",
  };
  const settingsRef = useRef(settings);
  const clickRef = useRef(onCardClick);

  // Synced in an effect, not during render, so the animation loop always reads the latest props.
  useEffect(() => {
    settingsRef.current = settings;
    clickRef.current = onCardClick;
  });

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const bodies: Body[] = [];
    const state = { hovered: -1, time: 0, layer: -1 };
    let raf = 0;
    let last = performance.now();
    let alive = true;

    const body = (i: number): Body => {
      if (!bodies[i]) {
        const slot = settingsRef.current.slots[i] ?? { x: 0, y: 0, rotate: 0 };
        bodies[i] = {
          x: slot.x,
          y: slot.y,
          rotate: slot.rotate,
          scale: reduce ? 1 : 0,
          vx: 0,
          vy: 0,
          vr: 0,
          vs: 0,
          born: state.time,
        };
      }
      return bodies[i];
    };

    const step = (
      value: number,
      velocity: number,
      target: number,
      stiffness: number,
      damping: number,
      dt: number,
    ): [number, number] => {
      const next = velocity + ((target - value) * stiffness - velocity * damping) * dt;
      return [value + next * dt, next];
    };

    const frame = (now: number) => {
      raf = 0;
      if (!alive) return;
      const s = settingsRef.current;
      const dt = Math.min(1 / 30, Math.max(1 / 240, (now - last) / 1000));
      last = now;
      state.time += dt;

      const hovered = s.enableHover ? state.hovered : -1;
      const popStiffness = 170;
      const popDamping = 2 * (1 - 0.85 * s.bounciness) * Math.sqrt(popStiffness);
      const moveStiffness = 210;
      const moveDamping = 2 * (reduce ? 1 : 0.72) * Math.sqrt(moveStiffness);
      const substeps = Math.ceil(dt / (1 / 240));
      const h = dt / substeps;
      let moving = 0;

      for (let i = 0; i < s.slots.length; i++) {
        const el = cardRefs.current[i];
        if (!el) continue;
        const card = body(i);
        const slot = s.slots[i];
        const appeared = reduce || state.time - card.born >= s.delay + i * s.stagger;
        let targetX = slot.x;
        let targetY = slot.y;
        let targetRotate = slot.rotate;
        let targetScale = appeared ? 1 : 0;
        if (hovered >= 0 && appeared) {
          if (i === hovered) {
            targetY = slot.y - s.cardSize * 0.04;
            targetRotate = 0;
            targetScale = s.hoverScale;
          } else {
            targetX = slot.x + Math.sign(i - hovered) * s.pushDistance;
          }
        }
        for (let k = 0; k < substeps; k++) {
          [card.x, card.vx] = step(card.x, card.vx, targetX, moveStiffness, moveDamping, h);
          [card.y, card.vy] = step(card.y, card.vy, targetY, moveStiffness, moveDamping, h);
          [card.rotate, card.vr] = step(
            card.rotate,
            card.vr,
            targetRotate,
            moveStiffness,
            moveDamping,
            h,
          );
          if (reduce) {
            card.scale = targetScale;
            card.vs = 0;
          } else {
            [card.scale, card.vs] = step(
              card.scale,
              card.vs,
              targetScale,
              popStiffness,
              popDamping,
              h,
            );
          }
        }
        moving +=
          Math.abs(card.vx) +
          Math.abs(card.vy) +
          Math.abs(card.vr) +
          Math.abs(card.vs) * 100 +
          Math.abs(targetX - card.x) +
          Math.abs(targetY - card.y) +
          Math.abs(targetRotate - card.rotate) +
          Math.abs(targetScale - card.scale) * 100 +
          (appeared ? 0 : 1);
        el.style.transform = `translate(-50%, -50%) translate3d(${card.x.toFixed(2)}px, ${card.y.toFixed(2)}px, 0) rotate(${card.rotate.toFixed(3)}deg) scale(${Math.max(0, card.scale).toFixed(4)})`;
      }

      if (state.layer !== hovered) {
        state.layer = hovered;
        cardRefs.current.forEach((el, i) => {
          if (!el) return;
          el.style.zIndex = i === hovered ? String(s.slots.length + 1) : String(i + 1);
          el.toggleAttribute("data-active", i === hovered);
        });
      }

      if (moving > 0.02) raf = requestAnimationFrame(frame);
    };

    const wake = () => {
      if (raf || !alive) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };
    wakeRef.current = wake;

    /** The card under the pointer, or -1. Measured in two dimensions so grid rows work. */
    const pick = (event: MouseEvent): number => {
      const s = settingsRef.current;
      const rect = root.getBoundingClientRect();
      const px = event.clientX - rect.left - rect.width / 2;
      const py = event.clientY - rect.top - rect.height / 2;
      let best = -1;
      let bestDistance = Infinity;
      s.slots.forEach((slot, i) => {
        const distance = Math.hypot(px - slot.x, py - slot.y);
        if (distance < bestDistance) {
          bestDistance = distance;
          best = i;
        }
      });
      if (best < 0) return -1;
      const slot = s.slots[best];
      const reachPx = s.cardSize / 2 + HIT_SLOP_PX;
      if (Math.abs(px - slot.x) > reachPx || Math.abs(py - slot.y) > reachPx) return -1;
      return best;
    };

    const onMove = (event: PointerEvent) => {
      const next = pick(event);
      if (next !== state.hovered) {
        state.hovered = next;
        wake();
      }
    };
    const onLeave = () => {
      if (state.hovered !== -1) {
        state.hovered = -1;
        wake();
      }
    };
    const onClick = (event: MouseEvent) => {
      const index = pick(event);
      if (index < 0) return;
      const card = bodies[index];
      if (card && !reduce) card.vs -= 2.2;
      wake();
      clickRef.current?.(index);
    };
    const onFocus = (event: FocusEvent) => {
      const index = cardRefs.current.indexOf(event.target as HTMLDivElement);
      if (index >= 0) {
        state.hovered = index;
        wake();
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      const index = cardRefs.current.indexOf(event.target as HTMLDivElement);
      if (index < 0 || !settingsRef.current.clickable) return;
      event.preventDefault();
      if (bodies[index] && !reduce) bodies[index].vs -= 2.2;
      wake();
      clickRef.current?.(index);
    };

    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerdown", onMove);
    root.addEventListener("pointerleave", onLeave);
    root.addEventListener("click", onClick);
    root.addEventListener("focusin", onFocus);
    root.addEventListener("focusout", onLeave);
    root.addEventListener("keydown", onKey);
    wake();

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      wakeRef.current = null;
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerdown", onMove);
      root.removeEventListener("pointerleave", onLeave);
      root.removeEventListener("click", onClick);
      root.removeEventListener("focusin", onFocus);
      root.removeEventListener("focusout", onLeave);
      root.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    wakeRef.current?.();
  });

  return (
    <div
      ref={rootRef}
      className={`${ROOT}${className ? ` ${className}` : ""}`}
      style={
        {
          width: containerWidth,
          height: containerHeight,
          "--bounce-cards-size": `${settings.cardSize}px`,
          "--bounce-cards-border": `${Math.max(0, borderWidth)}px`,
          "--bounce-cards-border-color": borderColor,
          "--bounce-cards-radius": `${Math.max(0, radius)}px`,
          "--bounce-cards-shadow": shadow
            ? "0 1px 2px rgba(0, 0, 0, 0.12), 0 10px 28px -6px rgba(0, 0, 0, 0.32)"
            : "none",
          "--bounce-cards-shadow-active": shadow
            ? "0 2px 4px rgba(0, 0, 0, 0.14), 0 22px 44px -10px rgba(0, 0, 0, 0.42)"
            : "none",
          ...style,
        } as React.CSSProperties
      }
    >
      {items.map((item, i) => (
        <div
          key={i}
          ref={(el) => {
            cardRefs.current[i] = el;
          }}
          className={settings.clickable ? `${CARD} ${CLICKABLE}` : CARD}
          style={
            {
              zIndex: i + 1,
              ...(item.accent ? { "--bounce-cards-border-color": item.accent } : {}),
            } as React.CSSProperties
          }
          {...(settings.clickable
            ? {
                role: "button",
                tabIndex: 0,
                "aria-label": item.label,
                "aria-pressed": item.selected ?? false,
              }
            : null)}
        >
          {item.content}
        </div>
      ))}
    </div>
  );
}
