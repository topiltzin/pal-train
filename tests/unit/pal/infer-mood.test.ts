import { describe, expect, it } from "vitest";
import { inferMoodFromText } from "@/features/pal/infer-mood";

describe("inferMoodFromText", () => {
  it.each([
    ["I'm so tired after work", "tired"],
    ["feeling pumped and ready to go", "energized"],
    ["stressed and totally overwhelmed today", "stressed"],
    ["I need to lock in and focus", "focused"],
    ["keep it fun and silly", "playful"],
    ["no motivation, I feel lazy", "unmotivated"],
    ["let's go beast mode, I want to sweat", "want-to-sweat"],
    ["I just want to chill and relax", "calm"],
  ])("maps %j to %s", (text, expected) => {
    // Act
    const mood = inferMoodFromText(text);

    // Assert
    expect(mood).toBe(expected);
  });

  it("ignores a keyword that is negated", () => {
    // Act
    const mood = inferMoodFromText("I'm not tired at all");

    // Assert
    expect(mood).toBeNull();
  });

  it("picks the mood with the most matching keywords", () => {
    // Act
    const mood = inferMoodFromText("tired, but I want to sweat it out hard");

    // Assert
    expect(mood).toBe("want-to-sweat");
  });

  it("returns null for empty or unrelated text", () => {
    // Act and Assert
    expect(inferMoodFromText("")).toBeNull();
    expect(inferMoodFromText("   ")).toBeNull();
    expect(inferMoodFromText("qwerty zxcvb")).toBeNull();
  });

  it("ignores case and punctuation", () => {
    // Act
    const mood = inferMoodFromText("TIRED!!!");

    // Assert
    expect(mood).toBe("tired");
  });
});
