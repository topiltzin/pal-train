"use client";

import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { FocusPicker } from "@/components/focus-picker";
import { LibraryError } from "@/components/library-error";
import { MedicalNotice } from "@/components/medical-notice";
import { MoodCheckIn } from "@/components/mood-check-in";
import { MoodPicker } from "@/components/mood-picker";
import { Pip } from "@/components/pal/pip";
import { SuggestionList } from "@/components/suggestion-list";
import { SuggestionSkeleton } from "@/components/suggestion-skeleton";
import type { FocusArea, FocusId } from "@/features/library/focus-areas";
import type { Mood, MoodId } from "@/features/moods/moods";
import { moodExpression, type PalExpression } from "@/features/pal/expressions";
import type { SuggestionView } from "@/features/suggestions/suggestion-view";

type Status = "idle" | "loading" | "ready" | "error";

type SuggestionsResponse = {
  success: boolean;
  data: { partial: boolean; suggestions: SuggestionView[] } | null;
  error: { code: string; message: string } | null;
};

type Selection = { mood: MoodId | null; focus: FocusId | null };

const GENERIC_ERROR = "I couldn't fetch ideas just now. Give it another try in a moment.";
const INTRO_COPY = "Hey, I'm Pip. Tell me how you feel, or tap a mood below.";
const LIBRARY_UNAVAILABLE = "LIBRARY_UNAVAILABLE";
const DEFAULT_ACCENT = "var(--color-accent-sky)";
const DEFAULT_EXPRESSION: PalExpression = "happy";

async function postSelection(endpoint: string, selection: Selection): Promise<SuggestionsResponse> {
  const body = {
    ...(selection.mood ? { mood: selection.mood } : {}),
    ...(selection.focus ? { focus: selection.focus } : {}),
  };
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return (await response.json()) as SuggestionsResponse;
}

export function HomeExperience({
  moods,
  focusAreas,
}: {
  moods: readonly Mood[];
  focusAreas: readonly FocusArea[];
}) {
  const reduce = useReducedMotion();
  const [selection, setSelection] = useState<Selection>({ mood: null, focus: null });
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<SuggestionsResponse["data"]>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>(GENERIC_ERROR);

  const selectedMood = moods.find((mood) => mood.id === selection.mood);
  const selectedFocusArea = focusAreas.find((area) => area.id === selection.focus);
  const pipAccent = selectedMood ? `var(--color-${selectedMood.accent})` : DEFAULT_ACCENT;
  const pipExpression = selection.mood ? moodExpression[selection.mood] : DEFAULT_EXPRESSION;

  async function request(endpoint: string, next: Selection) {
    setStatus("loading");
    try {
      const body = await postSelection(endpoint, next);
      if (body.success && body.data) {
        setResult(body.data);
        setErrorCode(null);
        setStatus("ready");
        return;
      }
      setErrorCode(body.error?.code ?? null);
      setErrorMessage(body.error?.message ?? GENERIC_ERROR);
      setStatus("error");
    } catch {
      setErrorCode(null);
      setErrorMessage(GENERIC_ERROR);
      setStatus("error");
    }
  }

  function runSelection(next: Selection) {
    setSelection(next);
    if (next.mood === null && next.focus === null) {
      setResult(null);
      setErrorCode(null);
      setStatus("idle");
      return;
    }
    void request("/api/suggestions", next);
  }

  function showAnotherIdea() {
    void request("/api/suggestions/next", selection);
  }

  return (
    <div className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-80 opacity-30 transition-colors duration-500 ease-out [mask-image:linear-gradient(black,transparent)]"
        style={{ backgroundColor: pipAccent }}
      />
      <main className="relative mx-auto flex w-full max-w-md flex-col gap-8 px-4 py-6 md:max-w-3xl md:py-10">
        <h1 className="sr-only">Plan your session with Pip</h1>
        <section className="flex items-center gap-4">
          <div className="relative shrink-0">
            <div className="relative md:scale-125">
              <Pip
                expression={pipExpression}
                accent={pipAccent}
                label={selectedMood?.label.toLowerCase() ?? "ready"}
                sizePx={132}
              />
            </div>
          </div>
          <div className="relative flex-1 rounded-2xl border-2 border-black/15 bg-white p-4 text-pretty text-base leading-snug">
            <span
              aria-hidden
              className="absolute -left-2 top-6 size-3.5 -rotate-45 border-b-2 border-l-2 border-black/15 bg-white"
            />
            {selectedMood ? selectedMood.buddyLine : INTRO_COPY}
          </div>
        </section>

        <MoodCheckIn moods={moods} onMood={(mood) => runSelection({ ...selection, mood })} />

        <section className="flex flex-col gap-3">
          <h2 className="text-base font-semibold">Your mood</h2>
          <MoodPicker
            moods={moods}
            selectedMood={selection.mood}
            onSelect={(mood) => runSelection({ ...selection, mood })}
          />
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-base font-semibold">Muscle group</h2>
          <FocusPicker
            focusAreas={focusAreas}
            selectedFocus={selection.focus}
            onSelect={(focus) => runSelection({ ...selection, focus })}
          />
          {selectedFocusArea ? (
            <Link
              href={`/library/${selectedFocusArea.id}`}
              className="text-sm font-semibold underline"
            >
              Browse all {selectedFocusArea.label} ideas
            </Link>
          ) : null}
        </section>

        {status === "loading" ? <SuggestionSkeleton /> : null}
        {status === "error" && errorCode === LIBRARY_UNAVAILABLE ? <LibraryError /> : null}
        {status === "error" && errorCode !== LIBRARY_UNAVAILABLE ? (
          <p role="alert">{errorMessage}</p>
        ) : null}
        {status === "ready" && result ? (
          <SuggestionList
            suggestions={result.suggestions}
            partial={result.partial}
            onAnotherIdea={showAnotherIdea}
          />
        ) : null}
        <MedicalNotice />
      </main>
    </div>
  );
}
