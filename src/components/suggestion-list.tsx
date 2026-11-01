import Link from "next/link";
import type { SuggestionView } from "@/features/suggestions/suggestion-view";

type SuggestionListProps = {
  suggestions: readonly SuggestionView[];
  partial: boolean;
  onAnotherIdea?: () => void;
};

export function SuggestionList({ suggestions, partial, onAnotherIdea }: SuggestionListProps) {
  return (
    <section aria-label="Workout ideas" className="flex flex-col gap-4">
      {partial ? (
        <p className="text-sm">Not a perfect match, but these are the closest ideas I have.</p>
      ) : null}
      {onAnotherIdea ? (
        <button
          type="button"
          onClick={onAnotherIdea}
          className="self-start rounded-full border-2 border-black px-4 py-2 text-sm font-semibold"
        >
          Another idea
        </button>
      ) : null}
      {suggestions.map((item) => (
        <article key={item.id} className="rounded-2xl border-2 border-black/20 bg-white p-4">
          <h3 className="text-lg font-bold">
            <Link
              href={`/library/${item.focus}/${item.id}`}
              className="underline-offset-4 hover:underline"
            >
              {item.name}
            </Link>
          </h3>
          <p className="text-sm">
            {item.focus} · {item.durationMinutes} min · {item.intensity} intensity
          </p>
          <p className="text-sm">Equipment: {item.equipment.join(", ")}</p>
          <p className="mt-2">{item.description}</p>
          {item.caution ? (
            <p role="note" className="mt-2 rounded-lg bg-amber-100 p-2 text-sm">
              Heads up: {item.caution}
            </p>
          ) : null}
        </article>
      ))}
    </section>
  );
}
