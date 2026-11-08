/** The four states of one workout timer. `totalMs` never changes for a timer. */
export type TimerState =
  | { status: "ready"; totalMs: number }
  | { status: "running"; totalMs: number; endAt: number }
  | { status: "stopped"; totalMs: number; remainingMs: number }
  | { status: "finished"; totalMs: number };

export type TimerEvent =
  | { type: "start"; now: number }
  | { type: "stop"; now: number }
  | { type: "reset" }
  | { type: "finish" }
  | { type: "tick"; now: number };

export function createTimer(totalMs: number): TimerState {
  return { status: "ready", totalMs };
}

/** Time left at `now`. Never negative. Reads the stored value when the timer is not running. */
export function remainingMs(state: TimerState, now: number): number {
  switch (state.status) {
    case "ready":
      return state.totalMs;
    case "running":
      return Math.max(0, state.endAt - now);
    case "stopped":
      return state.remainingMs;
    case "finished":
      return 0;
  }
}

/**
 * Pure transitions. An event that is not allowed in the current state returns the same object,
 * so repeated taps have a single effect.
 */
export function timerReducer(state: TimerState, event: TimerEvent): TimerState {
  switch (event.type) {
    case "start":
      if (state.status === "ready") {
        return { status: "running", totalMs: state.totalMs, endAt: event.now + state.totalMs };
      }
      if (state.status === "stopped") {
        return { status: "running", totalMs: state.totalMs, endAt: event.now + state.remainingMs };
      }
      return state;
    case "stop":
      if (state.status !== "running") return state;
      return {
        status: "stopped",
        totalMs: state.totalMs,
        remainingMs: Math.max(0, state.endAt - event.now),
      };
    case "reset":
      return state.status === "ready" ? state : createTimer(state.totalMs);
    case "finish":
      if (state.status === "running" || state.status === "stopped") {
        return { status: "finished", totalMs: state.totalMs };
      }
      return state;
    case "tick":
      if (state.status === "running" && event.now >= state.endAt) {
        return { status: "finished", totalMs: state.totalMs };
      }
      return state;
  }
}
