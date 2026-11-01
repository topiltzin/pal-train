import type { FocusId } from "@/features/library/focus-areas";
import type { Template } from "@/features/library/template.schema";
import type { MoodId } from "@/features/moods/moods";

export const MAX_SUGGESTIONS = 3;

export type SelectionInput = {
  templates: readonly Template[];
  mood?: MoodId;
  focus?: FocusId;
  lastTemplateId?: string | null;
  random?: () => number;
};

export type SelectionResult = {
  suggestions: Template[];
  partial: boolean;
};

const EMPTY_RESULT: SelectionResult = { suggestions: [], partial: false };

function fitsBoth(template: Template, mood?: MoodId, focus?: FocusId): boolean {
  const moodOk = mood === undefined || template.moods.includes(mood);
  const focusOk = focus === undefined || template.focus === focus;
  return moodOk && focusOk;
}

function fitsEither(template: Template, mood?: MoodId, focus?: FocusId): boolean {
  const moodOk = mood !== undefined && template.moods.includes(mood);
  const focusOk = focus !== undefined && template.focus === focus;
  return moodOk || focusOk;
}

function findCandidates(input: SelectionInput): { candidates: Template[]; partial: boolean } {
  const exact = input.templates.filter((template) => fitsBoth(template, input.mood, input.focus));
  if (exact.length > 0) {
    return { candidates: exact, partial: false };
  }
  const closest = input.templates.filter((template) =>
    fitsEither(template, input.mood, input.focus),
  );
  return { candidates: closest, partial: true };
}

function withoutLastShown(candidates: Template[], lastTemplateId?: string | null): Template[] {
  const alternatives = candidates.filter((template) => template.id !== lastTemplateId);
  return alternatives.length > 0 ? alternatives : candidates;
}

function shuffled(items: readonly Template[], random: () => number): Template[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

export function selectSuggestions(input: SelectionInput): SelectionResult {
  if (input.mood === undefined && input.focus === undefined) {
    return EMPTY_RESULT;
  }
  const { candidates, partial } = findCandidates(input);
  if (candidates.length === 0) {
    return { suggestions: [], partial };
  }
  const pool = withoutLastShown(candidates, input.lastTemplateId);
  const random = input.random ?? Math.random;
  return {
    suggestions: shuffled(pool, random).slice(0, MAX_SUGGESTIONS),
    partial,
  };
}
