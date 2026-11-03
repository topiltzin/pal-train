"use client";

import { Shuffle } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import type { SuggestionView } from "@/features/suggestions/suggestion-view";

type SuggestionListProps = {
  suggestions: readonly SuggestionView[];
  partial: boolean;
  onAnotherIdea?: () => void;
};

const INTENSITY_COLOR: Record<SuggestionView["intensity"], string> = {
  low: "var(--color-accent-mint)",
  moderate: "var(--color-accent-sunrise)",
  high: "var(--color-accent-coral)",
};

const STAGGER_SECONDS = 0.05;
const ENTER_EASE = [0.23, 1, 0.32, 1] as const;
const EXIT_SECONDS = 0.15;

export function SuggestionList({ suggestions, partial, onAnotherIdea }: SuggestionListProps) {
  const reduce = useReducedMotion();
  return (
    <section aria-label="Workout ideas" className="flex flex-col gap-4">
      {partial ? (
        <p className="text-sm">Not a perfect match, but these are the closest ideas I have.</p>
      ) : null}
      {onAnotherIdea ? (
        <motion.button
          type="button"
          onClick={onAnotherIdea}
          whileTap={reduce ? undefined : { scale: 0.97 }}
          transition={{ duration: 0.16, ease: ENTER_EASE }}
          className="flex items-center gap-2 self-start rounded-full border-2 border-foreground px-4 py-2 text-sm font-semibold"
        >
          <Shuffle size={16} weight="bold" aria-hidden />
          Another idea
        </motion.button>
      ) : null}
      <AnimatePresence mode="popLayout">
        {suggestions.map((item, index) => (
          <motion.article
            key={item.id}
            data-testid="routine-card"
            data-intensity={item.intensity}
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={
              reduce
                ? { opacity: 0 }
                : { opacity: 0, y: -8, transition: { duration: EXIT_SECONDS } }
            }
            transition={{
              duration: 0.3,
              ease: ENTER_EASE,
              delay: reduce ? 0 : index * STAGGER_SECONDS,
            }}
            className="rounded-2xl border-2 border-line bg-surface p-4"
          >
            <h3 className="text-lg font-bold">
              <Link
                href={`/library/${item.focus}/${item.id}`}
                className="underline-offset-4 hover:underline"
              >
                {item.name}
              </Link>
            </h3>
            <p className="flex flex-wrap items-center gap-2 text-sm">
              <span className="capitalize">{item.focus}</span>
              <span aria-hidden>·</span>
              <span>{item.durationMinutes} min</span>
              <span
                className="rounded-full px-2 py-0.5 text-xs font-semibold text-foreground"
                style={{ backgroundColor: INTENSITY_COLOR[item.intensity] }}
              >
                {item.intensity} intensity
              </span>
            </p>
            <p className="text-sm">Equipment: {item.equipment.join(", ")}</p>
            <p className="mt-2">{item.description}</p>
            {item.caution ? (
              <p role="note" className="mt-2 rounded-lg bg-amber-100 p-2 text-sm">
                Heads up: {item.caution}
              </p>
            ) : null}
          </motion.article>
        ))}
      </AnimatePresence>
    </section>
  );
}
