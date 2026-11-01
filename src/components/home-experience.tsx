"use client";

import Link from "next/link";
import { useState } from "react";
import { FocusPicker } from "@/components/focus-picker";
import { LibraryError } from "@/components/library-error";
import { MedicalNotice } from "@/components/medical-notice";
import { MoodPicker } from "@/components/mood-picker";
import { SuggestionList } from "@/components/suggestion-list";
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
const PROMPT_COPY = "Pick a mood or a focus area and I'll find a few ideas for you.";
const LIBRARY_UNAVAILABLE = "LIBRARY_UNAVAILABLE";

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

  const selectedLabel = moods.find((mood) => mood.id === selection.mood);
  const selectedFocusArea = focusAreas.find((area) => area.id === selection.focus);

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
    <div className="flex flex-col gap-6 px-4 py-6">
      <p className="text-base">{selectedLabel ? selectedLabel.buddyLine : PROMPT_COPY}</p>
      <MoodPicker
        moods={moods}
        selectedMood={selection.mood}
        onSelect={(mood) => runSelection({ ...selection, mood })}
      />
      <FocusPicker
        focusAreas={focusAreas}
        selectedFocus={selection.focus}
        onSelect={(focus) => runSelection({ ...selection, focus })}
      />
      {selectedFocusArea ? (
        <Link href={`/library/${selectedFocusArea.id}`} className="text-sm font-semibold underline">
          Browse all {selectedFocusArea.label} ideas
        </Link>
      ) : null}
      {status === "loading" ? <p role="status">Finding ideas…</p> : null}
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
    </div>
  );
}
