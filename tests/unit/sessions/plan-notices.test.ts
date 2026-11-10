import { describe, expect, it } from "vitest";
import type { Exercise } from "@/features/sessions/exercise.schema";
import { buildGroupNotices, groupNoticeText, joinNotices } from "@/features/sessions/plan-notices";

function makeExercise(id: string, focus: "biceps" | "triceps", minutes = 6): Exercise {
  return {
    id,
    name: `Exercise ${id}`,
    focus,
    moods: ["energized"],
    minutes,
    intensity: "low",
    equipment: ["none"],
  };
}

describe("buildGroupNotices", () => {
  it("gives no notice when a group has its full share", () => {
    // Arrange
    const chosen = [makeExercise("b1", "biceps"), makeExercise("b2", "biceps")];

    // Act
    const notices = buildGroupNotices({
      groups: ["biceps"],
      share: 2,
      chosen,
      available: { biceps: chosen },
      maxMinutes: 60,
    });

    // Assert
    expect(notices).toEqual([]);
  });

  it("says no_exercises when the library has none for a group", () => {
    // Arrange, Act
    const notices = buildGroupNotices({
      groups: ["triceps"],
      share: 2,
      chosen: [],
      available: { triceps: [] },
      maxMinutes: 60,
    });

    // Assert
    expect(notices).toEqual([{ group: "triceps", reason: "no_exercises" }]);
  });

  it("says not_enough_time when the minutes cap leaves no room for the group's remaining exercises", () => {
    // Arrange
    const triceps = [makeExercise("t1", "triceps", 10)];

    // Act
    const notices = buildGroupNotices({
      groups: ["triceps"],
      share: 2,
      chosen: [makeExercise("b1", "biceps", 10), makeExercise("b2", "biceps", 10)],
      available: { triceps },
      maxMinutes: 25,
    });

    // Assert
    expect(notices).toEqual([{ group: "triceps", reason: "not_enough_time" }]);
  });

  it("says not_enough_exercises when the group has fewer exercises than its share", () => {
    // Arrange
    const triceps = [makeExercise("t1", "triceps")];

    // Act
    const notices = buildGroupNotices({
      groups: ["triceps"],
      share: 3,
      chosen: [makeExercise("t1", "triceps")],
      available: { triceps },
      maxMinutes: 60,
    });

    // Assert
    expect(notices).toEqual([{ group: "triceps", reason: "not_enough_exercises" }]);
  });
});

describe("notice wording", () => {
  it("names the group in each sentence", () => {
    // Arrange, Act, Assert
    expect(groupNoticeText({ group: "triceps", reason: "no_exercises" })).toContain("Triceps");
    expect(groupNoticeText({ group: "triceps", reason: "not_enough_time" })).toContain("Triceps");
    expect(groupNoticeText({ group: "triceps", reason: "not_enough_exercises" })).toContain(
      "Triceps",
    );
  });

  it("joins the shortfall note with each group sentence, and is null when there is nothing to say", () => {
    // Arrange, Act, Assert
    expect(joinNotices(null, [])).toBeNull();
    expect(
      joinNotices("Only 3 exercises fit.", [{ group: "biceps", reason: "no_exercises" }]),
    ).toBe("Only 3 exercises fit. Biceps: the library has no exercises for this group yet.");
  });
});
