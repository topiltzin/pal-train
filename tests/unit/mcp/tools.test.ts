import { describe, expect, it } from "vitest";
import { loadExerciseLibrary } from "@/features/sessions/exercise-library";
import { planSession } from "@/features/sessions/plan-session";
import { MEDICAL_NOTICE_TEXT } from "@/features/sessions/medical-notice-text";
import {
  ToolInputError,
  listExercisesTool,
  listFocusAreasTool,
  planSessionTool,
} from "@/features/mcp/tools";

const exercises = loadExerciseLibrary().list();

function errorOf(action: () => unknown): ToolInputError {
  try {
    action();
  } catch (error) {
    if (error instanceof ToolInputError) return error;
    throw error;
  }
  throw new Error("expected a ToolInputError");
}

describe("list_focus_areas", () => {
  it("returns each focus area with its id and label", () => {
    // Arrange, Act
    const areas = listFocusAreasTool();

    // Assert
    expect(areas.length).toBeGreaterThan(0);
    expect(Object.keys(areas[0]).sort()).toEqual(["id", "label"]);
  });
});

describe("list_exercises", () => {
  it("rejects an unknown focus and lists the valid ids", () => {
    // Arrange, Act
    const error = errorOf(() => listExercisesTool(exercises, { focus: "nonsense" }));

    // Assert
    expect(error.code).toBe("invalid_focus");
    expect(error.detail).toContain("legs");
  });

  it("returns only the public exercise fields for one focus", () => {
    // Arrange, Act
    const list = listExercisesTool(exercises, { focus: "legs" });

    // Assert
    expect(list.length).toBeGreaterThan(0);
    expect(Object.keys(list[0]).sort()).toEqual(
      ["caution", "description", "equipment", "id", "intensity", "minutes", "name"].sort(),
    );
  });
});

describe("plan_session", () => {
  it("rejects a request with neither a mood nor a focus", () => {
    // Arrange, Act
    const error = errorOf(() => planSessionTool(exercises, { minutes: 30 }));

    // Assert
    expect(error.code).toBe("missing_source");
  });

  it("rejects a length outside 10 to 90 minutes or not in steps of 5", () => {
    // Arrange, Act
    const tooLong = errorOf(() => planSessionTool(exercises, { focus: "legs", minutes: 95 }));
    const offStep = errorOf(() => planSessionTool(exercises, { focus: "legs", minutes: 32 }));

    // Assert
    expect(tooLong.code).toBe("invalid_minutes");
    expect(offStep.code).toBe("invalid_minutes");
  });

  it("caps a gentle mood at its maximum length", () => {
    // Arrange, Act
    const error = errorOf(() => planSessionTool(exercises, { mood: "tired", minutes: 60 }));

    // Assert
    expect(error.code).toBe("invalid_minutes");
  });

  it("returns the same exercises as the app's planner for the same inputs", () => {
    // Arrange
    const random = () => 0.42;
    const direct = planSession({
      exercises,
      minMinutes: 30,
      maxMinutes: 30,
      focus: "legs",
      random,
    });

    // Act
    const viaTool = planSessionTool(exercises, { focus: "legs", minutes: 30, random });

    // Assert
    expect(viaTool.exercises.map((exercise) => exercise.id)).toEqual(
      direct.exercises.map((exercise) => exercise.id),
    );
    expect(viaTool.totalMinutes).toBe(direct.totalMinutes);
  });

  it("includes the medical notice and no personal fields", () => {
    // Arrange, Act
    const plan = planSessionTool(exercises, { focus: "legs", minutes: 30 });

    // Assert
    expect(plan.medicalNotice).toBe(MEDICAL_NOTICE_TEXT);
    expect(JSON.stringify(plan)).not.toMatch(/@|"email"|"displayName"|"sub"/);
  });
});
