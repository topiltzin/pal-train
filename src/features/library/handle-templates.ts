import { z } from "zod";
import { requireUser, type SessionGetter } from "@/features/auth/session";
import { browseTemplates, MAX_BROWSE_LIMIT } from "@/features/library/browse-templates";
import { focusIds, type FocusId } from "@/features/library/focus-areas";
import { loadLibrary } from "@/features/library/library-repository";
import { intensityLevels } from "@/features/moods/moods";
import { toSuggestionView } from "@/features/suggestions/suggestion-view";
import { ok } from "@/lib/api/envelope";
import { ErrorCodes } from "@/lib/api/error-codes";
import { errorResponse } from "@/lib/api/errors";
import { routeErrorResponse } from "@/lib/api/route-error";

const MIN_LIMIT = 1;
const MAX_LIMIT = MAX_BROWSE_LIMIT;
const MIN_MINUTES = 10;
const MAX_MINUTES = 90;
const DIGITS_ONLY = /^\d+$/;

const digitsToNumber = (min: number, max: number) =>
  z
    .string()
    .regex(DIGITS_ONLY, "Use a whole number.")
    .transform(Number)
    .pipe(z.number().int().min(min).max(max));

const templateQuerySchema = z.object({
  focus: z.string().min(1, "Pick a focus area."),
  intensity: z
    .enum(intensityLevels, { error: "Intensity must be low, moderate, or high." })
    .optional(),
  maxMinutes: digitsToNumber(MIN_MINUTES, MAX_MINUTES).optional(),
  limit: digitsToNumber(MIN_LIMIT, MAX_LIMIT).optional(),
  offset: z.string().regex(DIGITS_ONLY, "Use a whole number.").transform(Number).optional(),
});

type TemplateQuery = z.infer<typeof templateQuerySchema>;

function isFocusId(value: string): value is FocusId {
  return (focusIds as readonly string[]).includes(value);
}

function firstIssueMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Invalid request.";
}

export async function handleListTemplates(
  request: Request,
  getSession?: SessionGetter,
): Promise<Response> {
  try {
    await requireUser(getSession);
    const parsed = templateQuerySchema.safeParse(
      Object.fromEntries(new URL(request.url).searchParams),
    );
    if (!parsed.success) {
      return errorResponse(ErrorCodes.INVALID_INPUT, firstIssueMessage(parsed.error));
    }
    const query: TemplateQuery = parsed.data;
    if (!isFocusId(query.focus)) {
      return errorResponse(ErrorCodes.NOT_FOUND, "No focus area has that name.");
    }
    const result = browseTemplates(loadLibrary(), { ...query, focus: query.focus });
    return Response.json(
      ok(result.items.map(toSuggestionView), {
        total: result.total,
        limit: result.limit,
        offset: result.offset,
      }),
    );
  } catch (error) {
    return routeErrorResponse(error, "GET /api/templates");
  }
}

export async function handleGetTemplate(id: string, getSession?: SessionGetter): Promise<Response> {
  try {
    await requireUser(getSession);
    const template = loadLibrary().byId(id);
    if (!template) {
      return errorResponse(ErrorCodes.NOT_FOUND, "No workout idea has that id.");
    }
    return Response.json(ok(toSuggestionView(template)));
  } catch (error) {
    return routeErrorResponse(error, "GET /api/templates/{id}");
  }
}
