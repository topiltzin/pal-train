/**
 * What the embedded player tells the page. A load event is not enough: a video the player cannot
 * show still loads its frame. The player's own messages say when it is playing and when it failed.
 */
export type PlayerReadiness = "ready" | "failed";

const READY_EVENT = "onReady";
const ERROR_EVENT = "onError";

function parseMessage(data: unknown): unknown {
  if (typeof data !== "string") return data;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

/** Maps a player message to ready or failed; returns null for every other message. */
export function readPlayerEvent(data: unknown): PlayerReadiness | null {
  const message = parseMessage(data);
  if (typeof message !== "object" || message === null || !("event" in message)) return null;
  if (message.event === READY_EVENT) return "ready";
  if (message.event === ERROR_EVENT) return "failed";
  return null;
}
