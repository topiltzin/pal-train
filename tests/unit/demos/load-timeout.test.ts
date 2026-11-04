import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEMO_LOAD_TIMEOUT_MS, startLoadTimeout } from "@/features/demos/load-timeout";

describe("startLoadTimeout", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("calls back after 10 seconds when the video never loads", () => {
    // Arrange
    const onTimeout = vi.fn();
    startLoadTimeout(onTimeout);

    // Act
    vi.advanceTimersByTime(DEMO_LOAD_TIMEOUT_MS);

    // Assert
    expect(DEMO_LOAD_TIMEOUT_MS).toBe(10_000);
    expect(onTimeout).toHaveBeenCalledTimes(1);
  });

  it("does not call back when cancelled before the timeout", () => {
    // Arrange
    const onTimeout = vi.fn();
    const cancel = startLoadTimeout(onTimeout);

    // Act
    vi.advanceTimersByTime(DEMO_LOAD_TIMEOUT_MS - 1);
    cancel();
    vi.advanceTimersByTime(DEMO_LOAD_TIMEOUT_MS);

    // Assert
    expect(onTimeout).not.toHaveBeenCalled();
  });

  it("can be cancelled twice without error", () => {
    // Arrange
    const cancel = startLoadTimeout(() => undefined);

    // Act / Assert
    expect(() => {
      cancel();
      cancel();
    }).not.toThrow();
  });
});
