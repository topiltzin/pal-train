import { afterEach, describe, expect, it, vi } from "vitest";
import type { EventName } from "@/features/analytics/event-catalog";
import { track } from "@/features/analytics/track";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("track", () => {
  it("does nothing when there is no window (server render)", () => {
    // Arrange: the node test environment has no window global

    // Act
    const sent = track("suggestion requested");

    // Assert
    expect(sent).toBe(false);
  });

  it("does nothing when the tracker script has not loaded", () => {
    // Arrange
    vi.stubGlobal("window", {});

    // Act
    const sent = track("suggestion requested");

    // Assert
    expect(sent).toBe(false);
  });

  it("sends the event name and data to the tracker when it is loaded", () => {
    // Arrange
    const umami = { track: vi.fn() };
    vi.stubGlobal("window", { umami });

    // Act
    const sent = track("exercise demo watched", { exerciseId: "push-up" });

    // Assert
    expect(sent).toBe(true);
    expect(umami.track).toHaveBeenCalledWith("exercise demo watched", { exerciseId: "push-up" });
  });

  it("sends an event with no data as the name and an empty data object", () => {
    // Arrange
    const umami = { track: vi.fn() };
    vi.stubGlobal("window", { umami });

    // Act
    track("mood selected");

    // Assert
    expect(umami.track).toHaveBeenCalledWith("mood selected", {});
  });

  it("does not throw when the tracker throws", () => {
    // Arrange
    vi.stubGlobal("window", {
      umami: {
        track: () => {
          throw new Error("blocked by an ad blocker");
        },
      },
    });

    // Act and Assert
    expect(() => track("suggestion requested")).not.toThrow();
    expect(track("suggestion requested")).toBe(false);
  });

  it("rejects an event name that is not in the catalog and sends nothing", () => {
    // Arrange
    const umami = { track: vi.fn() };
    vi.stubGlobal("window", { umami });

    // Act
    const sent = track("session started" as EventName);

    // Assert
    expect(sent).toBe(false);
    expect(umami.track).not.toHaveBeenCalled();
  });
});
