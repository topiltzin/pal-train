import Link from "next/link";
import { notFound } from "next/navigation";
import { LibraryError } from "@/components/library-error";
import { SuggestionList } from "@/components/suggestion-list";
import { TemplateFilters } from "@/components/template-filters";
import { browseTemplates, DEFAULT_BROWSE_LIMIT } from "@/features/library/browse-templates";
import { focusAreas, focusIds, type FocusId } from "@/features/library/focus-areas";
import { LibraryUnavailableError, loadLibrary } from "@/features/library/library-repository";
import { intensityLevels, type IntensityLevel } from "@/features/moods/moods";
import { toSuggestionView } from "@/features/suggestions/suggestion-view";

type SearchParams = Record<string, string | string[] | undefined>;

type LibraryPageProps = {
  params: Promise<{ focus: string }>;
  searchParams: Promise<SearchParams>;
};

type Filters = { intensity?: IntensityLevel; maxMinutes?: number };

const MIN_MINUTES = 10;
const MAX_MINUTES = 90;

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function isFocusId(value: string): value is FocusId {
  return (focusIds as readonly string[]).includes(value);
}

function parseIntensity(value: string | undefined): IntensityLevel | undefined {
  return (intensityLevels as readonly string[]).includes(value ?? "")
    ? (value as IntensityLevel)
    : undefined;
}

function parseMinutes(value: string | undefined): number | undefined {
  const minutes = Number(value);
  const isValid = Number.isInteger(minutes) && minutes >= MIN_MINUTES && minutes <= MAX_MINUTES;
  return isValid ? minutes : undefined;
}

function parsePage(value: string | undefined): number {
  const page = Number(value);
  return Number.isInteger(page) && page >= 1 ? page : 1;
}

function pageHref(focus: FocusId, filters: Filters, page: number): string {
  const params = new URLSearchParams();
  if (filters.intensity) params.set("intensity", filters.intensity);
  if (filters.maxMinutes) params.set("maxMinutes", String(filters.maxMinutes));
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/library/${focus}?${query}` : `/library/${focus}`;
}

function PagingLinks({
  focus,
  filters,
  page,
  totalPages,
}: {
  focus: FocusId;
  filters: Filters;
  page: number;
  totalPages: number;
}) {
  return (
    <nav aria-label="Pages" className="flex justify-between text-sm font-semibold">
      {page > 1 ? <Link href={pageHref(focus, filters, page - 1)}>Previous</Link> : <span />}
      <span>
        Page {page} of {totalPages}
      </span>
      {page < totalPages ? <Link href={pageHref(focus, filters, page + 1)}>Next</Link> : <span />}
    </nav>
  );
}

export default async function LibraryPage({ params, searchParams }: LibraryPageProps) {
  const { focus } = await params;
  if (!isFocusId(focus)) {
    notFound();
  }
  const query = await searchParams;
  const filters: Filters = {
    intensity: parseIntensity(firstValue(query.intensity)),
    maxMinutes: parseMinutes(firstValue(query.maxMinutes)),
  };
  const page = parsePage(firstValue(query.page));
  const area = focusAreas.find((candidate) => candidate.id === focus);

  let result;
  try {
    result = browseTemplates(loadLibrary(), {
      focus,
      ...filters,
      offset: (page - 1) * DEFAULT_BROWSE_LIMIT,
    });
  } catch (error) {
    if (error instanceof LibraryUnavailableError) {
      return <LibraryError />;
    }
    throw error;
  }

  const totalPages = Math.max(1, Math.ceil(result.total / DEFAULT_BROWSE_LIMIT));
  return (
    <main className="flex flex-col gap-6 px-4 py-6">
      <header className="flex flex-col gap-1">
        <Link href="/" className="text-sm font-semibold underline">
          Back to my buddy picks
        </Link>
        <h1 className="text-2xl font-bold">{area?.label ?? focus} ideas</h1>
        <p className="text-sm">{area?.description}</p>
      </header>
      <TemplateFilters
        focus={focus}
        intensity={filters.intensity}
        maxMinutes={filters.maxMinutes}
      />
      {result.total === 0 ? (
        <p className="text-sm">No ideas match those filters yet. Try loosening one of them.</p>
      ) : (
        <SuggestionList suggestions={result.items.map(toSuggestionView)} partial={false} />
      )}
      {result.total > 0 ? (
        <PagingLinks focus={focus} filters={filters} page={page} totalPages={totalPages} />
      ) : null}
    </main>
  );
}
