"use client";

import Link from "next/link";
import { useState, type CSSProperties } from "react";
import { FocusPicker } from "@/components/focus-picker";
import { LibraryError } from "@/components/library-error";
import { MedicalNotice } from "@/components/medical-notice";
import { MoodGallery } from "@/components/mood-gallery";
import { SuggestionList } from "@/components/suggestion-list";
import { SessionPlanner } from "@/components/session-planner";
import { SuggestionSkeleton } from "@/components/suggestion-skeleton";
import type { FocusArea, FocusId } from "@/features/library/focus-areas";
import type { Mood, MoodId } from "@/features/moods/moods";
import type { SuggestionView } from "@/features/suggestions/suggestion-view";

type Status = "idle" | "loading" | "ready" | "error";

type SuggestionsResponse = {
  success: boolean;
  data: { partial: boolean; suggestions: SuggestionView[] } | null;
  error: { code: string; message: string } | null;
};

type Selection = { mood: MoodId | null; focus: FocusId | null };

const GENERIC_ERROR = "I couldn't fetch ideas just now. Give it another try in a moment.";
const INTRO_COPY = "Hi, I'm Pip. Pick how you feel, then a muscle group for ideas.";
const LIBRARY_UNAVAILABLE = "LIBRARY_UNAVAILABLE";
const DEFAULT_ACCENT = "var(--color-accent-sky)";

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
  const [selection, setSelection] = useState<Selection>({ mood: null, focus: null });
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<SuggestionsResponse["data"]>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>(GENERIC_ERROR);

  const selectedMood = moods.find((mood) => mood.id === selection.mood);
  const selectedFocusArea = focusAreas.find((area) => area.id === selection.focus);
  const pipAccent = selectedMood ? `var(--color-${selectedMood.accent})` : DEFAULT_ACCENT;

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
    <div
      className="relative min-h-[100dvh] overflow-hidden"
      style={{ "--mood": pipAccent } as CSSProperties}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-20 transition-colors duration-500 ease-out [mask-image:linear-gradient(black,black_80%,rgb(0_0_0_/_0.6))]"
        style={{ backgroundColor: pipAccent }}
      />
      <main className="relative mx-auto flex w-full max-w-md flex-col gap-8 px-4 py-6 md:max-w-3xl md:py-10">
        <h1 className="sr-only">Plan your session with Pip</h1>
        <p className="text-pretty text-lg leading-snug">
          {selectedMood ? selectedMood.buddyLine : INTRO_COPY}
        </p>

        <section className="flex flex-col gap-5 mood-card rounded-3xl p-5 ring-1 ring-line">
          <h2 className="text-base font-semibold">How are you feeling?</h2>
          <MoodGallery
            moods={moods}
            selectedMood={selection.mood}
            onSelect={(mood) => runSelection({ ...selection, mood })}
          />
        </section>

        <section className="flex flex-col gap-4 mood-card rounded-3xl p-5 ring-1 ring-line">
          <h2 className="text-base font-semibold">Muscle group</h2>
          <FocusPicker
            focusAreas={focusAreas}
            selectedFocus={selection.focus}
            onSelect={(focus) => runSelection({ ...selection, focus })}
          />
          {selectedFocusArea ? (
            <Link
              href={`/library/${selectedFocusArea.id}`}
              className="inline-flex min-h-11 items-center text-sm font-semibold underline"
            >
              Browse all {selectedFocusArea.label} ideas
            </Link>
          ) : null}
          {status === "ready" && result ? (
            <a
              href="#ideas"
              className="inline-flex min-h-11 items-center text-sm font-semibold underline"
            >
              See the ideas
            </a>
          ) : null}
        </section>

        <SessionPlanner mood={selection.mood ?? undefined} focus={selection.focus ?? undefined} />

        {status === "loading" ? <SuggestionSkeleton /> : null}
        {status === "error" && errorCode === LIBRARY_UNAVAILABLE ? <LibraryError /> : null}
        {status === "error" && errorCode !== LIBRARY_UNAVAILABLE ? (
          <p role="alert">{errorMessage}</p>
        ) : null}
        {status === "ready" && result ? (
          <div id="ideas" className="scroll-mt-4">
            <SuggestionList
              suggestions={result.suggestions}
              partial={result.partial}
              onAnotherIdea={showAnotherIdea}
            />
          </div>
        ) : null}
        <MedicalNotice />
      </main>
    </div>
  );
}
