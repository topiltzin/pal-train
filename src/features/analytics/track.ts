import { type EventName, validateEvent } from "@/features/analytics/event-catalog";

type UmamiTracker = {
  track: (name: string, data: Record<string, string>) => void;
  identify: (distinctId: string) => void;
};

type WindowWithUmami = Window & { umami?: UmamiTracker };

function loadedTracker(): UmamiTracker | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }
  return (window as WindowWithUmami).umami;
}

/**
 * Sends one catalog event to Umami. Returns false when nothing was sent: the tracker is not
 * loaded (server render, blocked script), the event is not in the catalog, or the tracker threw.
 * It never throws, so an analytics failure cannot break the action that triggered it (FR-009).
 */
export function track(name: EventName, data: Record<string, unknown> = {}): boolean {
  const tracker = loadedTracker();
  if (!tracker) {
    return false;
  }
  const event = validateEvent(name, data);
  if (!event) {
    return false;
  }
  try {
    tracker.track(event.name, event.data);
    return true;
  } catch {
    return false;
  }
}

/**
 * Links this browser's later activity to one opaque account identifier. The caller passes only
 * the keyed hash from identity.ts, never an email or name. Same guarantees as track().
 */
export function identify(distinctId: string): boolean {
  const tracker = loadedTracker();
  if (!tracker) {
    return false;
  }
  try {
    tracker.identify(distinctId);
    return true;
  } catch {
    return false;
  }
}
