"use client";

import { useEffect, useRef, useState } from "react";
import FlexCarousel, { type FlexCarouselItem } from "@/components/flex-carousel";
import { moodCardArt } from "@/components/mood-card-art";
import { isUserChange, moodIndexFor } from "@/features/moods/carousel-selection";
import type { Mood, MoodId } from "@/features/moods/moods";
import { moodExpression } from "@/features/pal/expressions";

type MoodCarouselProps = {
  moods: readonly Mood[];
  selectedMood: MoodId | null;
  onSelect: (mood: MoodId) => void;
};

/** One height for the carousel and its placeholder, so the page does not jump when the cards arrive. */
const STAGE_CLASS = "h-[300px] w-full md:h-[360px]";
const LOAD_FAILED_MESSAGE = "Could not draw the mood cards. Reload the page to try again.";

function markInteracted(ref: { current: boolean }) {
  ref.current = true;
}

export function MoodCarousel({ moods, selectedMood, onSelect }: MoodCarouselProps) {
  const [items, setItems] = useState<FlexCarouselItem[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const interactedRef = useRef(false);
  const selectedIndex = moods.findIndex((mood) => mood.id === selectedMood);
  const shownMood = selectedIndex >= 0 ? moods[selectedIndex] : null;

  useEffect(() => {
    let cancelled = false;
    Promise.all(
      moods.map(async (mood) => ({
        src: await moodCardArt(moodExpression[mood.id]),
        alt: `Pip, looking ${mood.label.toLowerCase()}`,
        title: mood.label,
      })),
    )
      .then((cards) => {
        if (!cancelled) setItems(cards);
      })
      .catch(() => {
        if (!cancelled) setLoadFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [moods]);

  function handleChange(index: number) {
    if (isUserChange(index, selectedIndex, interactedRef.current)) {
      onSelect(moods[index].id);
    }
  }

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <div
        className={STAGE_CLASS}
        onPointerDown={() => markInteracted(interactedRef)}
        onKeyDown={() => markInteracted(interactedRef)}
        onWheel={() => markInteracted(interactedRef)}
      >
        {items ? (
          <FlexCarousel
            items={items}
            index={moodIndexFor(moods, selectedMood)}
            onChange={handleChange}
            fit="square"
            captions={false}
            radius={20}
            cardHeight={0.62}
            className="h-full"
          />
        ) : null}
        {!items && loadFailed ? (
          <p role="alert" className="flex h-full items-center justify-center text-center">
            {LOAD_FAILED_MESSAGE}
          </p>
        ) : null}
      </div>
      <p aria-live="polite" className="min-h-7 text-center text-lg font-bold">
        {shownMood ? shownMood.label : "Pick a mood"}
      </p>
    </div>
  );
}
