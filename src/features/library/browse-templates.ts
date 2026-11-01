import type { FocusId } from "@/features/library/focus-areas";
import type { LibraryRepository } from "@/features/library/library-repository";
import type { Template } from "@/features/library/template.schema";
import type { IntensityLevel } from "@/features/moods/moods";

export const DEFAULT_BROWSE_LIMIT = 20;
export const MAX_BROWSE_LIMIT = 50;

export type BrowseFilters = {
  intensity?: IntensityLevel;
  maxMinutes?: number;
};

export type BrowseRequest = BrowseFilters & {
  focus: FocusId;
  limit?: number;
  offset?: number;
};

export type BrowseResult = {
  items: Template[];
  total: number;
  limit: number;
  offset: number;
};

function matchesFilters(template: Template, filters: BrowseFilters): boolean {
  const intensityOk = filters.intensity === undefined || template.intensity === filters.intensity;
  const minutesOk =
    filters.maxMinutes === undefined || template.duration_minutes <= filters.maxMinutes;
  return intensityOk && minutesOk;
}

/** Filters one focus area's templates and returns a single page of them with paging totals. */
export function browseTemplates(library: LibraryRepository, request: BrowseRequest): BrowseResult {
  const limit = request.limit ?? DEFAULT_BROWSE_LIMIT;
  const offset = request.offset ?? 0;
  const matches = library
    .byFocus(request.focus)
    .filter((template) => matchesFilters(template, request));
  return {
    items: matches.slice(offset, offset + limit),
    total: matches.length,
    limit,
    offset,
  };
}
