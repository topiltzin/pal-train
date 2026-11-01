import { describe, expect, it } from "vitest";
import { selectSuggestions } from "@/features/suggestions/select-suggestions";
import type { Template } from "@/features/library/template.schema";

const MAX_SUGGESTIONS = 3;

function makeTemplate(overrides: Partial<Template> & Pick<Template, "id">): Template {
  return {
    name: "Sample idea",
    focus: "legs",
    moods: ["energized"],
    duration_minutes: 20,
    intensity: "moderate",
    equipment: ["none"],
    description: "A sample workout idea.",
    ...overrides,
  };
}

const templates: Template[] = [
  makeTemplate({ id: "legs-001", focus: "legs", moods: ["energized"] }),
  makeTemplate({ id: "legs-002", focus: "legs", moods: ["energized", "focused"] }),
  makeTemplate({ id: "legs-003", focus: "legs", moods: ["tired"] }),
  makeTemplate({ id: "chest-001", focus: "chest", moods: ["energized"] }),
  makeTemplate({ id: "chest-002", focus: "chest", moods: ["tired"] }),
];

const fixedRandom = () => 0;

describe("selectSuggestions", () => {
  it("returns only templates that fit the selected mood", () => {
    // Act
    const result = selectSuggestions({ templates, mood: "tired", random: fixedRandom });

    // Assert
    expect(result.suggestions.every((item) => item.moods.includes("tired"))).toBe(true);
  });

  it("returns between one and three suggestions", () => {
    // Act
    const result = selectSuggestions({ templates, mood: "energized", random: fixedRandom });

    // Assert
    expect(result.suggestions.length).toBeGreaterThanOrEqual(1);
    expect(result.suggestions.length).toBeLessThanOrEqual(MAX_SUGGESTIONS);
  });

  it("marks the result as not partial when matches exist", () => {
    // Act
    const result = selectSuggestions({ templates, mood: "energized", random: fixedRandom });

    // Assert
    expect(result.partial).toBe(false);
  });

  it("returns only templates for the selected focus when no mood is set", () => {
    // Act
    const result = selectSuggestions({ templates, focus: "chest", random: fixedRandom });

    // Assert
    expect(result.suggestions.every((item) => item.focus === "chest")).toBe(true);
    expect(result.partial).toBe(false);
  });

  it("returns only templates matching both mood and focus when both are set", () => {
    // Act
    const result = selectSuggestions({
      templates,
      mood: "focused",
      focus: "legs",
      random: fixedRandom,
    });

    // Assert
    expect(result.suggestions.map((item) => item.id)).toEqual(["legs-002"]);
    expect(result.partial).toBe(false);
  });

  it("returns closest matches and marks partial when nothing matches both", () => {
    // Act
    const result = selectSuggestions({
      templates,
      mood: "focused",
      focus: "chest",
      random: fixedRandom,
    });

    // Assert
    expect(result.suggestions.length).toBeGreaterThanOrEqual(1);
    expect(result.partial).toBe(true);
  });

  it("does not repeat the last shown template when alternatives exist", () => {
    // Act
    const result = selectSuggestions({
      templates,
      mood: "energized",
      lastTemplateId: "legs-001",
      random: fixedRandom,
    });

    // Assert
    expect(result.suggestions.map((item) => item.id)).not.toContain("legs-001");
  });

  it("may repeat the last shown template when it is the only match", () => {
    // Act
    const result = selectSuggestions({
      templates: [makeTemplate({ id: "calm-001", moods: ["calm"] })],
      mood: "calm",
      lastTemplateId: "calm-001",
      random: fixedRandom,
    });

    // Assert
    expect(result.suggestions.map((item) => item.id)).toEqual(["calm-001"]);
  });

  it("returns an empty list when neither mood nor focus is set", () => {
    // Act
    const result = selectSuggestions({ templates, random: fixedRandom });

    // Assert
    expect(result.suggestions).toEqual([]);
  });
});
