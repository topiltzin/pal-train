import { z } from "zod";
import { requireUser, type SessionGetter } from "@/features/auth/session";
import { attachActiveDemos } from "@/features/demos/attach-active-demos";
import { defaultDemoLinks } from "@/features/demos/default-demo-links";
import type { DemoLinkRepository } from "@/features/demos/demo-link-repository";
import {
  ExerciseLibraryUnavailableError,
  loadExerciseLibrary,
} from "@/features/sessions/exercise-library";
import {
  MAX_EXERCISES,
  MAX_MINUTES,
  SLIDER_MIN_MINUTES,
  STEP_MINUTES,
} from "@/features/sessions/session-length";
import { swapOptionsFor } from "@/features/sessions/swap-alternatives";
import type { SwapAlternatives } from "@/features/sessions/session-view";
import { isJsonRequest, readJsonBody } from "@/lib/api/json-body";
import { ok } from "@/lib/api/envelope";
import { ErrorCodes } from "@/lib/api/error-codes";
import { errorResponse } from "@/lib/api/errors";
import { routeErrorResponse } from "@/lib/api/route-error";

const ROUTE_LABEL = "POST /api/exercise-alternatives";
const JSON_MESSAGE = "Send the request as JSON.";
const NOT_IN_LIBRARY_MESSAGE = "That exercise is not in the library.";
const NOT_IN_PLAN_MESSAGE = "Swap an exercise that is in the plan.";
const LENGTH_MESSAGE = `Pick a length between ${SLIDER_MIN_MINUTES} and ${MAX_MINUTES} minutes.`;
const STEP_MESSAGE = `Choose lengths in ${STEP_MINUTES}-minute steps.`;
const ORDER_MESSAGE = "The shortest session cannot be longer than the longest.";

const lengthField = z
  .number()
  .int()
  .min(SLIDER_MIN_MINUTES, { error: LENGTH_MESSAGE })
  .max(MAX_MINUTES, { error: LENGTH_MESSAGE })
  .refine((value) => value % STEP_MINUTES === 0, { error: STEP_MESSAGE });

const alternativesRequestSchema = z
  .object({
    exerciseId: z.string().min(1),
    currentExerciseIds: z.array(z.string().min(1)).min(1).max(MAX_EXERCISES),
    minMinutes: lengthField,
    maxMinutes: lengthField,
  })
  .superRefine((body, context) => {
    const libraryIds = new Set(
      loadExerciseLibrary()
        .list()
        .map((exercise) => exercise.id),
    );
    if (!libraryIds.has(body.exerciseId)) {
      context.addIssue({ code: "custom", message: NOT_IN_LIBRARY_MESSAGE, path: ["exerciseId"] });
    } else if (!body.currentExerciseIds.includes(body.exerciseId)) {
      context.addIssue({
        code: "custom",
        message: NOT_IN_PLAN_MESSAGE,
        path: ["currentExerciseIds"],
      });
    }
  })
  .refine((body) => body.minMinutes <= body.maxMinutes, { error: ORDER_MESSAGE });

/**
 * The same-type exercises a card can be swapped for, with demos attached. Pure rules live in
 * swap-alternatives.ts; this handler only checks the request and assembles the response.
 */
export async function handlePostExerciseAlternatives(
  request: Request,
  getSession?: SessionGetter,
  demoLinks: DemoLinkRepository = defaultDemoLinks,
): Promise<Response> {
  try {
    await requireUser(getSession);
    if (!isJsonRequest(request)) {
      return errorResponse(ErrorCodes.INVALID_INPUT, JSON_MESSAGE);
    }
    const parsed = alternativesRequestSchema.safeParse(await readJsonBody(request));
    if (!parsed.success) {
      return errorResponse(
        ErrorCodes.INVALID_INPUT,
        parsed.error.issues[0]?.message ?? "Invalid request.",
      );
    }
    return Response.json(ok(await buildAlternatives(parsed.data, demoLinks)));
  } catch (error) {
    if (error instanceof ExerciseLibraryUnavailableError) {
      return errorResponse(ErrorCodes.LIBRARY_UNAVAILABLE, error.message);
    }
    return routeErrorResponse(error, ROUTE_LABEL);
  }
}

type AlternativesRequest = z.infer<typeof alternativesRequestSchema>;

async function buildAlternatives(
  body: AlternativesRequest,
  demoLinks: DemoLinkRepository,
): Promise<SwapAlternatives> {
  const library = loadExerciseLibrary().list();
  const target = library.find((exercise) => exercise.id === body.exerciseId);
  const options = swapOptionsFor(library, body.exerciseId, body.currentExerciseIds, body);
  // Demos are looked up in one call, and the results come back in the same order as the options.
  const exercises = await attachActiveDemos(
    options.map((option) => option.exercise),
    demoLinks,
    library.map((exercise) => exercise.id),
    ROUTE_LABEL,
  );
  return {
    exerciseId: body.exerciseId,
    focus: target?.focus ?? library[0].focus,
    options: options.map((option, index) => ({ ...option, exercise: exercises[index] })),
  };
}
