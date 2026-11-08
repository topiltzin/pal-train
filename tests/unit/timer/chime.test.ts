import { describe, expect, it, vi } from "vitest";
import { playChime, primeChime, type ChimeContext } from "@/features/timer/chime";

function fakeContext() {
  const oscillators: { frequency: { value: number }; started: boolean }[] = [];
  const context: ChimeContext = {
    state: "running",
    currentTime: 0,
    destination: {},
    resume: async () => undefined,
    createOscillator: () => {
      const oscillator = {
        type: "sine",
        frequency: { value: 0 },
        started: false,
        connect() {},
        start() {
          oscillator.started = true;
        },
        stop() {},
      };
      oscillators.push(oscillator);
      return oscillator;
    },
    createGain: () => ({
      gain: {
        value: 0,
        setValueAtTime() {},
        linearRampToValueAtTime() {},
        exponentialRampToValueAtTime() {},
      },
      connect() {},
    }),
  };
  return { context, oscillators };
}

describe("playChime", () => {
  it("plays two tones on one audio context", () => {
    // Arrange
    const { context, oscillators } = fakeContext();

    // Act
    const played = playChime(() => context);

    // Assert
    expect(played).toBe(true);
    expect(oscillators).toHaveLength(2);
    expect(oscillators.every((oscillator) => oscillator.started)).toBe(true);
  });

  it("reports that no sound played when audio is not available", () => {
    // Arrange, Act
    const played = playChime(() => undefined);

    // Assert
    expect(played).toBe(false);
  });

  it("reuses the context created on Start for the chime at the end", () => {
    // Arrange
    const { context, oscillators } = fakeContext();
    primeChime(() => context);

    // Act
    const played = playChime();

    // Assert
    expect(played).toBe(true);
    expect(oscillators).toHaveLength(2);
  });

  it("uses the browser's audio context, falling back to the older prefixed name", async () => {
    // Arrange: a fresh module with only the prefixed browser constructor available
    vi.resetModules();
    const fresh = await import("@/features/timer/chime");
    const { context, oscillators } = fakeContext();
    vi.stubGlobal("window", {
      webkitAudioContext: function Prefixed() {
        return context;
      },
    });

    // Act
    fresh.primeChime();
    const played = fresh.playChime();

    // Assert
    expect(played).toBe(true);
    expect(oscillators).toHaveLength(2);
    vi.unstubAllGlobals();
  });

  it("resumes a suspended context during the Start tap", async () => {
    // Arrange: a fresh module, so no context was primed by the tests above
    vi.resetModules();
    const fresh = await import("@/features/timer/chime");
    let resumed = 0;
    const { context } = fakeContext();
    const suspended: ChimeContext = {
      ...context,
      state: "suspended",
      resume: async () => {
        resumed += 1;
      },
    };

    // Act
    fresh.primeChime(() => suspended);

    // Assert
    expect(resumed).toBe(1);
  });

  it("reports that no sound played, without throwing, when the tone cannot be made", () => {
    // Arrange
    const { context } = fakeContext();
    const broken: ChimeContext = {
      ...context,
      createOscillator: () => {
        throw new Error("audio blocked");
      },
    };

    // Act and Assert
    expect(() => playChime(() => broken)).not.toThrow();
    expect(playChime(() => broken)).toBe(false);
  });
});
