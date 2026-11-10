import { z } from "zod";
import { requireUser, type SessionGetter } from "@/features/auth/session";
import { attachDemos } from "@/features/demos/attach-demos";
import type { DemoLinkRepository } from "@/features/demos/demo-link-repository";
import type { GroupNotice } from "@/features/sessions/plan-notices";
import { MAX_FOCUS_GROUPS, parseFocusSelection } from "@/features/sessions/focus-selection";
import { withLinkCache } from "@/features/demos/cached-demo-link-repository";
import { createDrizzleDemoLinkRepository } from "@/features/demos/drizzle-demo-link-repository";
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
const JSON_CONTENT_TYPE = "application/json";

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

const defaultDemoLinks: DemoLinkRepository = withLinkCache(createDrizzleDemoLinkRepository());

/**
 * Attaches each exercise's active demo. Demos are an enhancement, so a failed lookup is logged
 * and the plan still returns, with every demo set to null.
 */
async function attachActiveDemos(
  exercises: ExerciseView[],
  demoLinks: DemoLinkRepository,
  libraryIds: string[],
): Promise<ExerciseView[]> {
  try {
    // Every library id is looked up, not only the picked ones: plans are random, so one lookup for
    // the whole library fills the cache once instead of a little more on every request.
    const links = await demoLinks.listActiveByExerciseIds(libraryIds);
    return attachDemos(exercises, links);
  } catch (error) {
    console.error(`${ROUTE_LABEL} demo lookup failed`, error);
    return exercises.map((exercise) => ({ ...exercise, demo: null }));
  }
}

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
    );
    return Response.json(ok(toPlanView(plan, body, exercises)));
  } catch (error) {
    if (error instanceof ExerciseLibraryUnavailableError) {
      return errorResponse(ErrorCodes.LIBRARY_UNAVAILABLE, error.message);
    }
    return routeErrorResponse(error, ROUTE_LABEL);
  }
}
