import { afterEach, describe, expect, it, vi } from "vitest";
import { identify } from "@/features/analytics/track";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("identify", () => {
  it("does nothing when there is no window (server render)", () => {
    // Arrange: the node test environment has no window global

    // Act
    const sent = identify("0123456789abcdef0123456789abcdef01234567");

    // Assert
    expect(sent).toBe(false);
  });

  it("does nothing when the tracker script has not loaded", () => {
    // Arrange
    vi.stubGlobal("window", {});

    // Act
    const sent = identify("0123456789abcdef0123456789abcdef01234567");

    // Assert
    expect(sent).toBe(false);
  });

  it("sends only the opaque distinct identifier to the tracker", () => {
    // Arrange
    const umami = { track: vi.fn(), identify: vi.fn() };
    vi.stubGlobal("window", { umami });
    const distinctId = "0123456789abcdef0123456789abcdef01234567";

    // Act
    const sent = identify(distinctId);

    // Assert
    expect(sent).toBe(true);
    expect(umami.identify).toHaveBeenCalledWith(distinctId);
  });

  it("does not throw when the tracker throws", () => {
    // Arrange
    vi.stubGlobal("window", {
      umami: {
        track: vi.fn(),
        identify: () => {
          throw new Error("blocked by an ad blocker");
        },
      },
    });

    // Act and Assert
    expect(() => identify("0123456789abcdef0123456789abcdef01234567")).not.toThrow();
  });
});
