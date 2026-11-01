import type { SessionGetter } from "@/features/auth/session";
import { handlePostSuggestions } from "@/features/suggestions/handle-suggestions";

/**
 * "Another idea" uses the same selection as POST /api/suggestions. The selection rules already
 * drop the last shown template whenever an alternative exists (FR-008), so the two handlers share
 * one implementation and differ only in the route they are mounted on.
 */
export function handleNextSuggestions(
  request: Request,
  getSession?: SessionGetter,
): Promise<Response> {
  return handlePostSuggestions(request, getSession);
}
