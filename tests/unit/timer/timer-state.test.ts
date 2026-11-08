import { describe, expect, it } from "vitest";
import {
  createTimer,
  remainingMs,
  timerReducer,
  type TimerState,
} from "@/features/timer/timer-state";

const TOTAL_MS = 600_000;
const T0 = 1_000_000;

describe("timerReducer", () => {
  it("starts from ready with an end moment one full length ahead", () => {
    // Arrange
    const ready = createTimer(TOTAL_MS);

    // Act
    const next = timerReducer(ready, { type: "start", now: T0 });

    // Assert
    expect(next).toEqual({ status: "running", totalMs: TOTAL_MS, endAt: T0 + TOTAL_MS });
  });

  it("resumes from stopped with the remaining time", () => {
    // Arrange
    const stopped: TimerState = { status: "stopped", totalMs: TOTAL_MS, remainingMs: 120_000 };

    // Act
    const next = timerReducer(stopped, { type: "start", now: T0 });

    // Assert
    expect(next).toEqual({ status: "running", totalMs: TOTAL_MS, endAt: T0 + 120_000 });
  });

  it("stops a running timer and keeps the remaining time", () => {
    // Arrange
    const running: TimerState = { status: "running", totalMs: TOTAL_MS, endAt: T0 + TOTAL_MS };

    // Act
    const next = timerReducer(running, { type: "stop", now: T0 + 30_000 });

    // Assert
    expect(next).toEqual({ status: "stopped", totalMs: TOTAL_MS, remainingMs: 570_000 });
  });

  it("returns to ready from any state on reset", () => {
    // Arrange
    const finished: TimerState = { status: "finished", totalMs: TOTAL_MS };

    // Act
    const next = timerReducer(finished, { type: "reset" });

    // Assert
    expect(next).toEqual(createTimer(TOTAL_MS));
  });

  it("finishes early from running or stopped", () => {
    // Arrange
    const running: TimerState = { status: "running", totalMs: TOTAL_MS, endAt: T0 + TOTAL_MS };
    const stopped: TimerState = { status: "stopped", totalMs: TOTAL_MS, remainingMs: 1_000 };

    // Act and Assert
    expect(timerReducer(running, { type: "finish" })).toEqual({
      status: "finished",
      totalMs: TOTAL_MS,
    });
    expect(timerReducer(stopped, { type: "finish" })).toEqual({
      status: "finished",
      totalMs: TOTAL_MS,
    });
  });

  it("finishes on a tick only once the end moment has passed", () => {
    // Arrange
    const running: TimerState = { status: "running", totalMs: TOTAL_MS, endAt: T0 + TOTAL_MS };

    // Act
    const beforeEnd = timerReducer(running, { type: "tick", now: T0 + TOTAL_MS - 1 });
    const atEnd = timerReducer(running, { type: "tick", now: T0 + TOTAL_MS });

    // Assert
    expect(beforeEnd).toBe(running);
    expect(atEnd).toEqual({ status: "finished", totalMs: TOTAL_MS });
  });

  it("ignores an event that is not allowed in the current state and returns the same object", () => {
    // Arrange
    const ready = createTimer(TOTAL_MS);

    // Act and Assert
    expect(timerReducer(ready, { type: "stop", now: T0 })).toBe(ready);
    expect(timerReducer(ready, { type: "finish" })).toBe(ready);
    expect(timerReducer(ready, { type: "tick", now: T0 })).toBe(ready);
  });

  it("gives one effect to repeated Start taps", () => {
    // Arrange
    const ready = createTimer(TOTAL_MS);

    // Act
    const once = timerReducer(ready, { type: "start", now: T0 });
    const twice = timerReducer(once, { type: "start", now: T0 + 500 });

    // Assert
    expect(twice).toBe(once);
  });
});

describe("remainingMs", () => {
  it("is never negative", () => {
    // Arrange
    const running: TimerState = { status: "running", totalMs: TOTAL_MS, endAt: T0 };

    // Act and Assert
    expect(remainingMs(running, T0 + 5_000)).toBe(0);
  });

  it("reads the full length from ready and zero from finished", () => {
    // Arrange, Act, Assert
    expect(remainingMs(createTimer(TOTAL_MS), T0)).toBe(TOTAL_MS);
    expect(remainingMs({ status: "finished", totalMs: TOTAL_MS }, T0)).toBe(0);
  });
});
