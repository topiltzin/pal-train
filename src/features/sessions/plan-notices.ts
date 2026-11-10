import type { FocusId } from "@/features/library/focus-areas";
import { focusAreas } from "@/features/library/focus-areas";
import type { Exercise } from "@/features/sessions/exercise.schema";
import { sumMinutes } from "@/features/sessions/session-view";

/** Why a muscle group in a plan is missing or short (spec FR-008). */
export const NOTICE_REASONS = ["no_exercises", "not_enough_time", "not_enough_exercises"] as const;

export type NoticeReason = (typeof NOTICE_REASONS)[number];

export type GroupNotice = { group: FocusId; reason: NoticeReason };

export type GroupNoticeInput = {
  groups: readonly FocusId[];
  /** The exercises each group should get in this plan. */
  share: number;
  /** The exercises the plan chose, across all groups. */
  chosen: readonly Exercise[];
  /** Every exercise the library has for each group, used or not. */
  available: Partial<Record<FocusId, readonly Exercise[]>>;
  maxMinutes: number;
};

/** The reason a short group is short: nothing in the library, no time left, or too few exercises. */
function reasonFor(input: GroupNoticeInput, group: FocusId): NoticeReason | null {
  const have = input.chosen.filter((exercise) => exercise.focus === group).length;
  if (have >= input.share) {
    return null;
  }
  const pool = input.available[group] ?? [];
  if (pool.length === 0) {
    return "no_exercises";
  }
  const unused = pool.filter((exercise) => !input.chosen.includes(exercise));
  const minutesLeft = input.maxMinutes - sumMinutes(input.chosen);
  const shortestUnused = Math.min(...unused.map((exercise) => exercise.minutes));
  if (unused.length > 0 && shortestUnused > minutesLeft) {
    return "not_enough_time";
  }
  return "not_enough_exercises";
}

/**
 * Pure: names each group that did not get its share, with the reason. A group with its full share
 * gets no notice. Groups are reported in the order they were chosen.
 */
export function buildGroupNotices(input: GroupNoticeInput): GroupNotice[] {
  return input.groups.flatMap((group) => {
    const reason = reasonFor(input, group);
    return reason === null ? [] : [{ group, reason }];
  });
}

/** The sentence shown for one short group, using the group's label. */
export function groupNoticeText(notice: GroupNotice): string {
  const label = focusAreas.find((area) => area.id === notice.group)?.label ?? notice.group;
  if (notice.reason === "no_exercises") {
    return `${label}: the library has no exercises for this group yet.`;
  }
  if (notice.reason === "not_enough_time") {
    return `${label}: there was not enough time to include it.`;
  }
  return `${label}: only a few exercises fit, so this group is shorter.`;
}

/** One line for the planner: the existing shortfall note, then a sentence for each short group. */
export function joinNotices(
  shortfall: string | null,
  notices: readonly GroupNotice[],
): string | null {
  const lines = [shortfall, ...notices.map(groupNoticeText)].filter(
    (line): line is string => line !== null,
  );
  return lines.length > 0 ? lines.join(" ") : null;
}
