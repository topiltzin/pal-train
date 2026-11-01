import { z } from "zod";
import { requireUser, UnauthenticatedError, type SessionGetter } from "@/features/auth/session";
import { upsertUser } from "@/features/auth/user-repository";
import { focusIds } from "@/features/library/focus-areas";
import { LibraryUnavailableError, loadLibrary } from "@/features/library/library-repository";
import { moodIds } from "@/features/moods/moods";
import {
  getLastShownTemplateId,
  setLastShownTemplateId,
} from "@/features/suggestions/suggestion-state-repository";
import { selectSuggestions } from "@/features/suggestions/select-suggestions";
import { toSuggestionView } from "@/features/suggestions/suggestion-view";
import { ok } from "@/lib/api/envelope";
import { ErrorCodes } from "@/lib/api/error-codes";
import { errorResponse } from "@/lib/api/errors";

const suggestionRequestSchema = z
  .object({
    mood: z.enum(moodIds).optional(),
    focus: z.enum(focusIds).optional(),
  })
  .refine((body) => body.mood !== undefined || body.focus !== undefined, {
    message: "Pick a mood, a focus area, or both.",
  });

const JSON_CONTENT_TYPE = "application/json";

function isJsonRequest(request: Request): boolean {
  const contentType = request.headers.get("content-type") ?? "";
  return contentType.toLowerCase().startsWith(JSON_CONTENT_TYPE);
}

async function readJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
}

export async function handlePostSuggestions(
  request: Request,
  getSession?: SessionGetter,
): Promise<Response> {
  try {
    const claims = await requireUser(getSession);
    if (!isJsonRequest(request)) {
      return errorResponse(ErrorCodes.INVALID_INPUT, "Send the request as JSON.");
    }
    const parsed = suggestionRequestSchema.safeParse(await readJsonBody(request));
    if (!parsed.success) {
      return errorResponse(
        ErrorCodes.INVALID_INPUT,
        parsed.error.issues[0]?.message ?? "Invalid request.",
      );
    }
    const user = await upsertUser(claims);
    const lastTemplateId = await getLastShownTemplateId(user.id);
    const result = selectSuggestions({
      templates: loadLibrary().list(),
      mood: parsed.data.mood,
      focus: parsed.data.focus,
      lastTemplateId,
    });
    const last = result.suggestions.at(-1);
    if (last) {
      await setLastShownTemplateId(user.id, last.id);
    }
    return Response.json(
      ok({ partial: result.partial, suggestions: result.suggestions.map(toSuggestionView) }),
    );
  } catch (error) {
    if (error instanceof UnauthenticatedError) {
      return errorResponse(ErrorCodes.UNAUTHENTICATED, error.message);
    }
    if (error instanceof LibraryUnavailableError) {
      return errorResponse(ErrorCodes.LIBRARY_UNAVAILABLE, error.message);
    }
    console.error("POST /api/suggestions failed", error);
    return errorResponse(ErrorCodes.INTERNAL, "Something went wrong. Please try again.");
  }
}
