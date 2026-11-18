import { z } from "zod";
import { requireUser, type SessionGetter } from "@/features/auth/session";
import { attachActiveDemos } from "@/features/demos/attach-active-demos";
import { defaultDemoLinks } from "@/features/demos/default-demo-links";
import type { DemoLinkRepository } from "@/features/demos/demo-link-repository";
import type { GroupNotice } from "@/features/sessions/plan-notices";
import { parseFocusSelection } from "@/features/sessions/focus-selection";
import { moodIds } from "@/features/moods/moods";
import {
  ExerciseLibraryUnavailableError,
  loadExerciseLibrary,
} from "@/features/sessions/exercise-library";
import {
  describePlanNotice,
  planSession,
  type SessionPlan,
} from "@/features/sessions/plan-session";
import {
  GENTLE_MAX_MINUTES,
  isTooShort,
  maxMinutesFor,
  SHORTEST_MINUTES,
} from "@/features/sessions/session-cap";
import { MAX_MINUTES, SLIDER_MIN_MINUTES, STEP_MINUTES } from "@/features/sessions/session-length";
import { toExerciseView, type ExerciseView } from "@/features/sessions/session-view";
import { isJsonRequest, readJsonBody } from "@/lib/api/json-body";
import { ok } from "@/lib/api/envelope";
import { ErrorCodes } from "@/lib/api/error-codes";
import { errorResponse } from "@/lib/api/errors";
import { routeErrorResponse } from "@/lib/api/route-error";

const ROUTE_LABEL = "POST /api/session-plan";
const JSON_MESSAGE = "Send the request as JSON.";
const LENGTH_MESSAGE = `Pick a length between ${SLIDER_MIN_MINUTES} and ${MAX_MINUTES} minutes.`;
const STEP_MESSAGE = `Choose lengths in ${STEP_MINUTES}-minute steps.`;
const ORDER_MESSAGE = "The shortest session cannot be longer than the longest.";
const SOURCE_MESSAGE = "Pick a mood, a focus area, or both.";
const SHORT_MESSAGE = `Plan at least ${SHORTEST_MINUTES} minutes.`;
const GENTLE_LIMIT_MESSAGE = `Sessions for this mood stay at ${GENTLE_MAX_MINUTES} minutes or less.`;

const FOCUS_LIMIT_MESSAGE = "Choose up to three muscle groups.";

/** The message for a focus value that cannot be used (spec FR-002, FR-009). */
function focusMessage(selection: { reason: "too_many" | "unknown"; validIds: readonly string[] }) {
  return selection.reason === "too_many"
    ? FOCUS_LIMIT_MESSAGE
    : `Choose one of the focus areas: ${selection.validIds.join(", ")}.`;
}

/** The groups a request names. A value that cannot be used names none. */
function selectedGroups(focus: string | string[] | undefined) {
  const selection = parseFocusSelection(focus);
  return selection.ok ? selection.groups : [];
}

const lengthField = z
  .number()
  .int()
  .min(SLIDER_MIN_MINUTES, { error: LENGTH_MESSAGE })
  .max(MAX_MINUTES, { error: LENGTH_MESSAGE })
  .refine((value) => value % STEP_MINUTES === 0, { error: STEP_MESSAGE });

const sessionPlanRequestSchema = z
  .object({
    minMinutes: lengthField,
    maxMinutes: lengthField,
    mood: z.enum(moodIds).optional(),
    focus: z.union([z.string(), z.array(z.string())]).optional(),
  })
  .superRefine((body, context) => {
    const selection = parseFocusSelection(body.focus);
    if (!selection.ok) {
      context.addIssue({ code: "custom", message: focusMessage(selection), path: ["focus"] });
    }
  })
  .refine((body) => body.minMinutes <= body.maxMinutes, { error: ORDER_MESSAGE })
  .refine((body) => !isTooShort(body.maxMinutes), { error: SHORT_MESSAGE })
  .refine((body) => body.mood === undefined || body.maxMinutes <= maxMinutesFor(body.mood), {
    error: GENTLE_LIMIT_MESSAGE,
  })
  .refine((body) => body.mood !== undefined || selectedGroups(body.focus).length > 0, {
    error: SOURCE_MESSAGE,
  });

type SessionPlanRequest = z.infer<typeof sessionPlanRequestSchema>;

export type SessionPlanView = {
  exercises: ExerciseView[];
  totalMinutes: number;
  targetCount: number;
  partial: boolean;
  shortfallMessage: string | null;
  groupNotices: GroupNotice[];
};

function toPlanView(
  plan: SessionPlan,
  request: SessionPlanRequest,
  exercises: ExerciseView[],
): SessionPlanView {
  return {
    exercises,
    totalMinutes: plan.totalMinutes,
    targetCount: plan.targetCount,
    partial: plan.partial,
    shortfallMessage: describePlanNotice(plan, request.minMinutes, request.maxMinutes),
    groupNotices: plan.groupNotices,
  };
}

export async function handlePostSessionPlan(
  request: Request,
  getSession?: SessionGetter,
  demoLinks: DemoLinkRepository = defaultDemoLinks,
): Promise<Response> {
  try {
    await requireUser(getSession);
    if (!isJsonRequest(request)) {
      return errorResponse(ErrorCodes.INVALID_INPUT, JSON_MESSAGE);
    }
    const parsed = sessionPlanRequestSchema.safeParse(await readJsonBody(request));
    if (!parsed.success) {
      return errorResponse(
        ErrorCodes.INVALID_INPUT,
        parsed.error.issues[0]?.message ?? "Invalid request.",
      );
    }
    const body = parsed.data;
    const plan = planSession({
      exercises: loadExerciseLibrary().list(),
      minMinutes: body.minMinutes,
      maxMinutes: body.maxMinutes,
      mood: body.mood,
      focus: selectedGroups(body.focus),
    });
    const libraryIds = loadExerciseLibrary()
      .list()
      .map((exercise) => exercise.id);
    const exercises = await attachActiveDemos(
      plan.exercises.map(toExerciseView),
      demoLinks,
      libraryIds,
      ROUTE_LABEL,
    );
    return Response.json(ok(toPlanView(plan, body, exercises)));
  } catch (error) {
    if (error instanceof ExerciseLibraryUnavailableError) {
      return errorResponse(ErrorCodes.LIBRARY_UNAVAILABLE, error.message);
    }
    return routeErrorResponse(error, ROUTE_LABEL);
  }
}
