/**
 * The only events the app may send to analytics. A new event or field is a change to
 * specs/007-umami-analytics/contracts/event-catalog.md, made in the same commit.
 *
 * No field here may carry a name, email, mood value, note, or measurement (spec FR-005).
 */

type TextField = { maxLength: number };

export const EVENT_CATALOG = {
  "exercise demo watched": { fields: { exerciseId: { maxLength: 100 } } },
  "session plan requested": { fields: {} },
  "suggestion requested": { fields: {} },
  "mood selected": { fields: {} },
} as const satisfies Record<string, { fields: Record<string, TextField> }>;

export type EventName = keyof typeof EVENT_CATALOG;

export type EventData = Record<string, string>;

export type ValidEvent = { name: EventName; data: EventData };

export function isEventName(name: string): name is EventName {
  return Object.prototype.hasOwnProperty.call(EVENT_CATALOG, name);
}

/**
 * Returns a new event with only the fields the catalog allows, or null when the name is unknown,
 * a field is not listed, or a value has the wrong type or is too long.
 */
export function validateEvent(name: string, data: Record<string, unknown>): ValidEvent | null {
  if (!isEventName(name)) {
    return null;
  }
  const rules: Record<string, TextField> = EVENT_CATALOG[name].fields;
  const checked: EventData = {};
  for (const [field, value] of Object.entries(data)) {
    const rule = rules[field];
    if (!rule || typeof value !== "string" || value.length > rule.maxLength) {
      return null;
    }
    checked[field] = value;
  }
  return { name, data: checked };
}
