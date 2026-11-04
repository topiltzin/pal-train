"use client";

import Image from "next/image";
import { useState } from "react";
import Stack from "@/components/stack";
import type { Mood, MoodId } from "@/features/moods/moods";

type MoodStackProps = {
  moods: readonly Mood[];
  selectedMood: MoodId | null;
  onSelect: (mood: MoodId) => void;
};

/** Each mood's sticker lives in public/moods/<mood id>.png. */
const moodImageSrc = (mood: Mood) => `/moods/${mood.id}.png`;
// Room above the stack, so the cards behind the top one clear the heading.
// The stickers are square, so the stage stays near-square; a wide stage would crop their faces.
const STAGE_CLASS =
  "relative mx-auto h-[340px] w-full max-w-[340px] pt-8 md:h-[400px] md:max-w-[400px]";

/**
 * Swiping browses the moods. A mood is only chosen with the button, so a stray drag cannot
 * change the answer. The stack reports the card on top, and that is the mood being browsed.
 */
export function MoodStack({ moods, selectedMood, onSelect }: MoodStackProps) {
  const [browsingIndex, setBrowsingIndex] = useState(0);
  const browsing = moods[browsingIndex];
  const selectedIndex = moods.findIndex((mood) => mood.id === selectedMood);
  const isChosen = selectedIndex === browsingIndex;

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div className={STAGE_CLASS}>
        <Stack
          cards={moods.map((mood) => (
            <div key={mood.id} className="relative h-full w-full">
              <Image
                src={moodImageSrc(mood)}
                alt={`Pal Buddy, feeling ${mood.label.toLowerCase()}`}
                fill
                sizes="(min-width: 768px) 360px, 80vw"
                draggable={false}
                className="object-cover"
              />
            </div>
          ))}
          layout="cascade"
          visible={4}
          spread={0.3}
          radius={20}
          frame={0}
          shadow
          onChange={setBrowsingIndex}
          className="h-full"
        />
      </div>
      <p aria-live="polite" className="min-h-7 text-center text-lg font-bold">
        {selectedIndex >= 0 ? moods[selectedIndex].label : "Pick a mood"}
      </p>
      <button
        type="button"
        onClick={() => onSelect(browsing.id)}
        disabled={isChosen}
        className="inline-flex min-h-11 items-center justify-center rounded-full bg-accent px-6 text-sm font-semibold text-on-accent whitespace-nowrap transition-[filter,transform] duration-150 ease-out hover:brightness-110 motion-safe:active:scale-[0.98] disabled:cursor-default disabled:opacity-60 disabled:hover:brightness-100"
      >
        {isChosen ? `${browsing.label} chosen` : `Choose ${browsing.label}`}
      </button>
    </div>
  );
}
