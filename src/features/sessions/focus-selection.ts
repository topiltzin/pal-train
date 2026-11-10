import { focusIds, type FocusId } from "@/features/library/focus-areas";

/** The most muscle groups one workout can cover (spec Assumptions; research Decision 3). */
export const MAX_FOCUS_GROUPS = 3;

export type FocusSelection =
  | { ok: true; groups: FocusId[] }
  | { ok: false; reason: "too_many" | "unknown"; validIds: readonly FocusId[] };

function isFocusId(value: string): value is FocusId {
  return (focusIds as readonly string[]).includes(value);
}

/**
 * Pure: reads the focus value from the app or the connector. Accepts one id, a list of ids, or
 * nothing. Empty entries and repeats are dropped, keeping the first occurrence. A list longer than
 * the limit is refused, not trimmed, and an unknown id is refused with the valid ids.
 */
export function parseFocusSelection(input: string | string[] | undefined): FocusSelection {
  const raw = input === undefined ? [] : Array.isArray(input) ? input : [input];
  const groups = [...new Set(raw.filter((id) => id !== ""))];
  if (!groups.every(isFocusId)) {
    return { ok: false, reason: "unknown", validIds: focusIds };
  }
  if (groups.length > MAX_FOCUS_GROUPS) {
    return { ok: false, reason: "too_many", validIds: focusIds };
  }
  return { ok: true, groups };
}
