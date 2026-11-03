import { describe, expect, it } from "vitest";
import { focusAreas, focusIds } from "@/features/library/focus-areas";

const EXISTING_COUNT = 10;
const NEW_IDS = ["upper-body", "shoulders", "core"] as const;

describe("focus areas", () => {
  it("lists 13 muscle group options", () => {
    expect(focusAreas).toHaveLength(13);
    expect(focusIds).toHaveLength(13);
  });

  it("gives the new options the labels from the spec", () => {
    const labels = Object.fromEntries(focusAreas.map((area) => [area.id, area.label]));
    expect(labels["upper-body"]).toBe("Upper body");
    expect(labels["shoulders"]).toBe("Shoulders");
    expect(labels["core"]).toBe("Core");
  });

  it("appends the new options after the existing ones", () => {
    expect(focusIds.slice(EXISTING_COUNT)).toEqual([...NEW_IDS]);
  });

  it("uses a unique id for every option", () => {
    expect(new Set(focusIds).size).toBe(focusIds.length);
  });
});
