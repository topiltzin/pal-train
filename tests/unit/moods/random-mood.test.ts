import { describe, expect, it } from "vitest";
import { moods } from "@/features/moods/moods";
import { pickRandomMood } from "@/features/moods/random-mood";

describe("pickRandomMood", () => {
  it("returns one of the app's moods", () => {
    // Arrange, Act
    const mood = pickRandomMood(() => 0.42);

    // Assert
    expect(moods).toContain(mood);
  });

  it("returns the first mood when the random value is zero", () => {
    // Arrange, Act
    const mood = pickRandomMood(() => 0);

    // Assert
    expect(mood).toBe(moods[0]);
  });

  it("returns the last mood when the random value is just below one", () => {
    // Arrange, Act
    const mood = pickRandomMood(() => 0.9999);

    // Assert
    expect(mood).toBe(moods[moods.length - 1]);
  });
});
