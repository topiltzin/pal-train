"use client";

import { useMemo, useRef } from "react";
import FlexCarousel, { type FlexCarouselItem } from "@/components/flex-carousel";
import { isUserChange, moodIndexFor } from "@/features/moods/carousel-selection";
import type { Mood, MoodId } from "@/features/moods/moods";

type MoodCarouselProps = {
  moods: readonly Mood[];
  selectedMood: MoodId | null;
  onSelect: (mood: MoodId) => void;
};

/** Each mood's sticker lives in public/moods/<mood id>.png. */
const moodImageSrc = (mood: Mood) => `/moods/${mood.id}.png`;
const STAGE_CLASS = "h-[300px] w-full md:h-[360px]";

function markInteracted(ref: { current: boolean }) {
  ref.current = true;
}

export function MoodCarousel({ moods, selectedMood, onSelect }: MoodCarouselProps) {
  const interactedRef = useRef(false);
  const selectedIndex = moods.findIndex((mood) => mood.id === selectedMood);
  const shownMood = selectedIndex >= 0 ? moods[selectedIndex] : null;

  const cards = useMemo<FlexCarouselItem[]>(
    () =>
      moods.map((mood) => ({
        src: moodImageSrc(mood),
        alt: `Pal Buddy, feeling ${mood.label.toLowerCase()}`,
        title: mood.label,
      })),
    [moods],
  );

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
        <FlexCarousel
          items={cards}
          index={moodIndexFor(moods, selectedMood)}
          onChange={handleChange}
          fit="square"
          captions={false}
          radius={20}
          cardHeight={0.62}
          className="h-full"
        />
      </div>
      <p aria-live="polite" className="min-h-7 text-center text-lg font-bold">
        {shownMood ? shownMood.label : "Pick a mood"}
      </p>
    </div>
  );
}
