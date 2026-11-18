import { describe, expect, it } from "vitest";
import type { Exercise } from "@/features/sessions/exercise.schema";
import { swapOptionsFor, OVER_LENGTH_REASON } from "@/features/sessions/swap-alternatives";

function exercise(id: string, focus: Exercise["focus"], minutes: number, name = id): Exercise {
  return {
    id,
    name,
    focus,
    moods: ["energized"],
    minutes,
    intensity: "moderate",
    equipment: ["dumbbell"],
  };
}

const LIBRARY: Exercise[] = [
  exercise("biceps-001", "biceps", 7, "Dumbbell curl"),
  exercise("biceps-002", "biceps", 6, "Hammer curl"),
  exercise("biceps-004", "biceps", 8, "Barbell curl"),
  exercise("chest-001", "chest", 9, "Push-up"),
  exercise("biceps-005", "biceps", 5, "Incline curl"),
];

const WIDE_RANGE = { minMinutes: 0, maxMinutes: 90 };

describe("swapOptionsFor", () => {
  it("returns only exercises of the same focus, excluding the card's own exercise", () => {
    // Arrange
    const plan = ["biceps-004", "chest-001"];

    // Act
    const options = swapOptionsFor(LIBRARY, "biceps-004", plan, WIDE_RANGE);

    // Assert
    expect(options.map((option) => option.exercise.id)).toEqual([
      "biceps-001",
      "biceps-002",
      "biceps-005",
    ]);
  });

  it("never offers an exercise that is already in the plan", () => {
    // Arrange
    const plan = ["biceps-004", "biceps-002"];

    // Act
    const options = swapOptionsFor(LIBRARY, "biceps-004", plan, WIDE_RANGE);

    // Assert
    expect(options.map((option) => option.exercise.id)).toEqual(["biceps-001", "biceps-005"]);
  });

  it("returns options in library order", () => {
    // Arrange
    const plan = ["biceps-004"];

    // Act
    const options = swapOptionsFor(LIBRARY, "biceps-004", plan, WIDE_RANGE);

    // Assert
    expect(options.map((option) => option.exercise.id)).toEqual([
      "biceps-001",
      "biceps-002",
      "biceps-005",
    ]);
  });

  it("marks an option over the maximum as unavailable with the over-length reason", () => {
    // Arrange: plan is 8 + 9 = 17; swapping in Dumbbell curl (7) gives 16, above a maximum of 15
    const plan = ["biceps-004", "chest-001"];

    // Act
    const options = swapOptionsFor(LIBRARY, "biceps-004", plan, { minMinutes: 0, maxMinutes: 15 });

    // Assert
    const dumbbell = options.find((option) => option.exercise.id === "biceps-001");
    expect(dumbbell).toEqual(
      expect.objectContaining({ available: false, unavailableReason: OVER_LENGTH_REASON }),
    );
  });

  it("keeps an option available when the total lands exactly on the maximum", () => {
    // Arrange: 8 + 9 = 17; Hammer curl (6) gives 15, exactly the maximum
    const plan = ["biceps-004", "chest-001"];

    // Act
    const options = swapOptionsFor(LIBRARY, "biceps-004", plan, { minMinutes: 0, maxMinutes: 15 });

    // Assert
    const hammer = options.find((option) => option.exercise.id === "biceps-002");
    expect(hammer).toEqual(expect.objectContaining({ available: true, unavailableReason: null }));
  });

  it("marks an option that drops the total below the minimum as unavailable", () => {
    // Arrange: 8 + 9 = 17 with minimum 16; Incline curl (5) gives 14, below 16
    const plan = ["biceps-004", "chest-001"];

    // Act
    const options = swapOptionsFor(LIBRARY, "biceps-004", plan, { minMinutes: 16, maxMinutes: 30 });

    // Assert
    const incline = options.find((option) => option.exercise.id === "biceps-005");
    expect(incline).toEqual(
      expect.objectContaining({ available: false, unavailableReason: OVER_LENGTH_REASON }),
    );
  });

  it("keeps an option available when the total lands exactly on the minimum", () => {
    // Arrange: 8 + 9 = 17 with minimum 16; Dumbbell curl (7) gives 16, exactly the minimum
    const plan = ["biceps-004", "chest-001"];

    // Act
    const options = swapOptionsFor(LIBRARY, "biceps-004", plan, { minMinutes: 16, maxMinutes: 30 });

    // Assert
    const dumbbell = options.find((option) => option.exercise.id === "biceps-001");
    expect(dumbbell).toEqual(expect.objectContaining({ available: true }));
  });

  it("allows a swap that grows a plan already below its minimum", () => {
    // Arrange: plan is 5 with a minimum of 20 (already short); Barbell curl (8) grows it to 8
    const plan = ["biceps-005"];

    // Act
    const options = swapOptionsFor(LIBRARY, "biceps-005", plan, { minMinutes: 20, maxMinutes: 30 });

    // Assert
    const barbell = options.find((option) => option.exercise.id === "biceps-004");
    expect(barbell).toEqual(expect.objectContaining({ available: true }));
  });

  it("blocks a swap that shrinks a plan already below its minimum", () => {
    // Arrange: plan is 8 with a minimum of 20 (already short); Dumbbell curl (7) would shrink it
    const plan = ["biceps-004"];

    // Act
    const options = swapOptionsFor(LIBRARY, "biceps-004", plan, { minMinutes: 20, maxMinutes: 30 });

    // Assert
    const dumbbell = options.find((option) => option.exercise.id === "biceps-001");
    expect(dumbbell).toEqual(expect.objectContaining({ available: false }));
  });

  it("returns an empty list when no other exercise shares the focus", () => {
    // Arrange: only one chest exercise exists in this library
    const plan = ["chest-001"];

    // Act
    const options = swapOptionsFor(LIBRARY, "chest-001", plan, WIDE_RANGE);

    // Assert
    expect(options).toEqual([]);
  });

  it("takes minutes from the library rather than trusting the plan's values", () => {
    // Arrange
    const plan = ["biceps-004"];

    // Act
    const options = swapOptionsFor(LIBRARY, "biceps-004", plan, WIDE_RANGE);

    // Assert
    const hammer = options.find((option) => option.exercise.id === "biceps-002");
    expect(hammer?.exercise.minutes).toBe(6);
  });
});
