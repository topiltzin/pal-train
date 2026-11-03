"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type RefObject } from "react";
import BounceCards, { type BounceCardItem } from "@/components/bounce-cards";
import { Pip } from "@/components/pal/pip";
import { cardGridLayout } from "@/features/moods/card-grid";
import { moodExpression } from "@/features/pal/expressions";
import type { Mood, MoodId } from "@/features/moods/moods";

type MoodDialProps = {
  moods: readonly Mood[];
  selectedMood: MoodId | null;
  onSelect: (mood: MoodId) => void;
};

/** Used for the first paint, before the frame has been measured. Matches a 320px phone. */
const FIRST_PAINT_WIDTH_PX = 248;

/** Each mood's card shows Pip in that mood's tint and face. */
function moodCardContent(mood: Mood, pipSize: number) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-surface">
      <Pip
        expression={moodExpression[mood.id]}
        accent={`var(--color-${mood.accent})`}
        label={mood.label.toLowerCase()}
        sizePx={pipSize}
      />
    </div>
  );
}

/** Tracks the rendered width of an element, so the card grid fits the space it is given. */
function useElementWidth(ref: RefObject<HTMLElement | null>): number {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;
    const observer = new ResizeObserver(([entry]) => {
      setWidth(Math.round(entry.contentRect.width));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);
  return width;
}

function arrowStep(key: string, columns: number): number | null {
  switch (key) {
    case "ArrowRight":
      return 1;
    case "ArrowLeft":
      return -1;
    case "ArrowDown":
      return columns;
    case "ArrowUp":
      return -columns;
    default:
      return null;
  }
}

export function MoodDial({ moods, selectedMood, onSelect }: MoodDialProps) {
  const selectedIndex = moods.findIndex((mood) => mood.id === selectedMood);
  const shownMood = selectedIndex >= 0 ? moods[selectedIndex] : null;
  const frameRef = useRef<HTMLDivElement>(null);
  const measuredWidth = useElementWidth(frameRef);
  const layout = cardGridLayout(measuredWidth || FIRST_PAINT_WIDTH_PX, moods.length);

  const items: BounceCardItem[] = moods.map((mood, index) => {
    const selected = index === selectedIndex;
    return {
      label: mood.label,
      selected,
      accent: selected ? `var(--color-${mood.accent})` : undefined,
      content: moodCardContent(mood, layout.pipSize),
    };
  });

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const cards = Array.from(
      frameRef.current?.querySelectorAll<HTMLElement>('[role="button"]') ?? [],
    );
    const current = cards.indexOf(event.target as HTMLElement);
    const step = arrowStep(event.key, layout.columns);
    if (current < 0 || step === null) return;
    event.preventDefault();
    const next = (current + step + moods.length) % moods.length;
    onSelect(moods[next].id);
    cards[next]?.focus();
  }

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <div
        ref={frameRef}
        role="group"
        aria-label="How are you feeling?"
        onKeyDown={handleKeyDown}
        className="w-full"
      >
        <BounceCards
          items={items}
          slots={layout.slots}
          containerWidth={layout.containerWidth}
          containerHeight={layout.containerHeight}
          cardSize={layout.cardSize}
          pushDistance={0}
          hoverScale={1.06}
          borderWidth={3}
          borderColor="var(--color-line)"
          radius={Math.round(layout.cardSize * 0.2)}
          shadow={false}
          onCardClick={(index) => onSelect(moods[index].id)}
          className="mx-auto"
        />
      </div>
      <p aria-live="polite" className="min-h-7 text-center text-lg font-bold">
        {shownMood ? shownMood.label : "Pick a mood"}
      </p>
    </div>
  );
}
