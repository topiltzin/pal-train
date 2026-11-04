"use client";

import { useEffect, useRef, useState } from "react";
import AccordionGallery, { type AccordionGalleryItem } from "@/components/accordion-gallery";
import { moodCardArt } from "@/components/mood-card-art";
import { isUserChange, moodIndexFor } from "@/features/moods/mood-selection";
import type { Mood, MoodId } from "@/features/moods/moods";
import { moodExpression } from "@/features/pal/expressions";

type MoodGalleryProps = {
  moods: readonly Mood[];
  selectedMood: MoodId | null;
  onSelect: (mood: MoodId) => void;
};

const GALLERY_HEIGHT_PX = 340;
/**
 * Phones stack the panels. Eight collapsed panels take about 730px (84px minimum each plus gaps),
 * so this leaves room for the active panel to open.
 */
const PHONE_HEIGHT_CLASS = "max-[520px]:!h-[880px]";
const LOAD_FAILED_MESSAGE = "Could not draw the mood cards. Reload the page to try again.";

function markInteracted(ref: { current: boolean }) {
  ref.current = true;
}

export function MoodGallery({ moods, selectedMood, onSelect }: MoodGalleryProps) {
  const [items, setItems] = useState<AccordionGalleryItem[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const interactedRef = useRef(false);
  const selectedIndex = moods.findIndex((mood) => mood.id === selectedMood);
  const shownMood = selectedIndex >= 0 ? moods[selectedIndex] : null;

  useEffect(() => {
    let cancelled = false;
    Promise.all(
      moods.map(async (mood) => ({
        image: await moodCardArt(moodExpression[mood.id]),
        label: mood.label,
        alt: `Pip, looking ${mood.label.toLowerCase()}`,
      })),
    )
      .then((panels) => {
        if (!cancelled) setItems(panels);
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
        className="min-h-[340px] w-full"
        // Capture phase: the user's input is recorded before any panel handles it.
        onPointerDownCapture={() => markInteracted(interactedRef)}
        onKeyDownCapture={() => markInteracted(interactedRef)}
        onWheelCapture={() => markInteracted(interactedRef)}
      >
        {items ? (
          <AccordionGallery
            items={items}
            index={moodIndexFor(moods, selectedMood)}
            onChange={handleChange}
            trigger="click"
            height={GALLERY_HEIGHT_PX}
            gap={8}
            radius={18}
            accentColor="#3ddc97"
            overlayColor="#171b22"
            textColor="#eef1f5"
            className={`w-full ${PHONE_HEIGHT_CLASS}`}
          />
        ) : null}
        {!items && loadFailed ? (
          <p role="alert" className="flex h-[340px] items-center justify-center text-center">
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
