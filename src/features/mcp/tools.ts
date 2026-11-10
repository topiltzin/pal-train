import { focusAreas, focusIds, type FocusId } from "@/features/library/focus-areas";
import { moodIds, type MoodId } from "@/features/moods/moods";
import type { Exercise } from "@/features/sessions/exercise.schema";
import { MEDICAL_NOTICE_TEXT } from "@/features/sessions/medical-notice-text";
import { parseFocusSelection } from "@/features/sessions/focus-selection";
import type { GroupNotice } from "@/features/sessions/plan-notices";
import { describePlanNotice, planSession } from "@/features/sessions/plan-session";
import { maxMinutesFor } from "@/features/sessions/session-cap";
import { MAX_MINUTES, MIN_MINUTES, STEP_MINUTES } from "@/features/sessions/session-length";

/** A refusal the connector returns to the user, with a code the contract lists. */
export class ToolInputError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly detail?: readonly string[],
  ) {
    super(message);
    this.name = "ToolInputError";
  }
}

export type ExerciseView = {
  id: string;
  name: string;
  description: string | null;
  minutes: number;
  intensity: string;
  equipment: string[];
  caution: string | null;
};

export type PlanView = {
  exercises: ExerciseView[];
  totalMinutes: number;
  shortfallMessage: string | null;
  medicalNotice: string;
  groupNotices: GroupNotice[];
};

export type PlanRequest = {
  mood?: string;
  /** One muscle group, or a list of up to three. */
  focus?: string | string[];
  minutes: number;
  random?: () => number;
};

function toExerciseView(exercise: Exercise): ExerciseView {
  return {
    id: exercise.id,
    name: exercise.name,
    description: exercise.description ?? null,
    minutes: exercise.minutes,
    intensity: exercise.intensity,
    equipment: [...exercise.equipment],
    caution: exercise.caution ?? null,
  };
}

/** For tools that need exactly one muscle group. */
function requireOneFocus(focus: string): FocusId {
  const [group] = requireFocusGroups(focus);
  if (group === undefined) {
    throw new ToolInputError(
      "invalid_focus",
      `Choose one of the focus areas: ${focusIds.join(", ")}.`,
      focusIds,
    );
  }
  return group;
}

/** Reads the focus value the user named. Refuses a fourth group and any unknown group. */
function requireFocusGroups(focus: string | string[] | undefined): FocusId[] {
  const selection = parseFocusSelection(focus);
  if (selection.ok) {
    return selection.groups;
  }
  if (selection.reason === "too_many") {
    throw new ToolInputError("invalid_focus", "Choose up to three muscle groups.", focusIds);
  }
  throw new ToolInputError(
    "invalid_focus",
    `Choose one of the focus areas: ${focusIds.join(", ")}.`,
    focusIds,
  );
}

function requireMood(mood: string): MoodId {
  if (!(moodIds as readonly string[]).includes(mood)) {
    throw new ToolInputError(
      "invalid_mood",
      `Choose one of the moods: ${moodIds.join(", ")}.`,
      moodIds,
    );
  }
  return mood as MoodId;
}

function requireLength(minutes: number, mood: MoodId | undefined): void {
  const inRange = Number.isInteger(minutes) && minutes >= MIN_MINUTES && minutes <= MAX_MINUTES;
  const onStep = (minutes - MIN_MINUTES) % STEP_MINUTES === 0;
  if (!inRange || !onStep) {
    throw new ToolInputError(
      "invalid_minutes",
      `Choose a length from ${MIN_MINUTES} to ${MAX_MINUTES} minutes in steps of ${STEP_MINUTES}.`,
    );
  }
  if (mood !== undefined && minutes > maxMinutesFor(mood)) {
    throw new ToolInputError(
      "invalid_minutes",
      `Sessions for this mood stay at ${maxMinutesFor(mood)} minutes or less.`,
    );
  }
}

/** list_focus_areas: the focus areas the library offers. */
export function listFocusAreasTool(): { id: string; label: string }[] {
  return focusAreas.map(({ id, label }) => ({ id, label }));
}

/** list_exercises: the exercises for one focus area, in their public fields only. */
export function listExercisesTool(
  exercises: readonly Exercise[],
  input: { focus: string },
): ExerciseView[] {
  const focus = requireOneFocus(input.focus);
  return exercises.filter((exercise) => exercise.focus === focus).map(toExerciseView);
}

/**
 * plan_session: the same plan the app produces for the same mood, focus, and length. The length
 * is a single value, so the plan is built for exactly that many minutes.
 */
export function planSessionTool(exercises: readonly Exercise[], input: PlanRequest): PlanView {
  if (input.mood === undefined && input.focus === undefined) {
    throw new ToolInputError("missing_source", "Pick a mood, a focus area, or both.");
  }
  const mood = input.mood === undefined ? undefined : requireMood(input.mood);
  const groups = requireFocusGroups(input.focus);
  if (input.mood === undefined && groups.length === 0) {
    throw new ToolInputError("missing_source", "Pick a mood, a focus area, or both.");
  }
  requireLength(input.minutes, mood);

  const plan = planSession({
    exercises: [...exercises],
    minMinutes: input.minutes,
    maxMinutes: input.minutes,
    mood,
    focus: groups.length > 0 ? groups : undefined,
    random: input.random,
  });
  return {
    exercises: plan.exercises.map(toExerciseView),
    totalMinutes: plan.totalMinutes,
    shortfallMessage: describePlanNotice(plan, input.minutes, input.minutes),
    medicalNotice: MEDICAL_NOTICE_TEXT,
    groupNotices: plan.groupNotices,
  };
}
