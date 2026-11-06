import { describe, expect, it } from "vitest";
import { EVENT_CATALOG, validateEvent } from "@/features/analytics/event-catalog";

const MAX_EVENT_NAME_LENGTH = 50;
const PERSONAL_FIELD_DENYLIST = ["email", "name", "mood", "note", "weight", "measurement"];

describe("event catalog", () => {
  it("defines exactly the four approved events", () => {
    // Arrange, Act
    const names = Object.keys(EVENT_CATALOG).sort();

    // Assert
    expect(names).toEqual([
      "exercise demo watched",
      "mood selected",
      "session plan requested",
      "suggestion requested",
    ]);
  });

  it("keeps every event name within the Umami limit", () => {
    // Arrange, Act
    const names = Object.keys(EVENT_CATALOG);

    // Assert
    for (const name of names) {
      expect(name.length).toBeLessThanOrEqual(MAX_EVENT_NAME_LENGTH);
    }
  });

  it("has no event for actions the app does not perform", () => {
    // Arrange, Act
    const names = Object.keys(EVENT_CATALOG);

    // Assert
    expect(names).not.toContain("session started");
    expect(names).not.toContain("session completed");
    expect(names).not.toContain("mood check-in saved");
  });

  it("allows no personal field name in any event", () => {
    // Arrange, Act
    const fieldNames = Object.values(EVENT_CATALOG).flatMap((entry) => Object.keys(entry.fields));

    // Assert
    for (const field of fieldNames) {
      expect(PERSONAL_FIELD_DENYLIST).not.toContain(field);
    }
  });

  it("accepts the exerciseId for exercise demo watched", () => {
    // Arrange
    const data = { exerciseId: "push-up" };

    // Act
    const result = validateEvent("exercise demo watched", data);

    // Assert
    expect(result).toEqual({ name: "exercise demo watched", data: { exerciseId: "push-up" } });
  });

  it("rejects a field the event does not list", () => {
    // Arrange
    const data = { exerciseId: "push-up", email: "someone@example.com" };

    // Act
    const result = validateEvent("exercise demo watched", data);

    // Assert
    expect(result).toBeNull();
  });

  it("accepts an exerciseId of exactly 100 characters and rejects 101", () => {
    // Arrange
    const maxLength = "x".repeat(100);
    const overLength = "x".repeat(101);

    // Act and Assert
    expect(validateEvent("exercise demo watched", { exerciseId: maxLength })).not.toBeNull();
    expect(validateEvent("exercise demo watched", { exerciseId: overLength })).toBeNull();
  });

  it("rejects a value of the wrong type", () => {
    // Arrange
    const data = { exerciseId: 42 };

    // Act
    const result = validateEvent("exercise demo watched", data);

    // Assert
    expect(result).toBeNull();
  });

  it("rejects an event name that is not in the catalog", () => {
    // Arrange, Act
    const result = validateEvent("session started", {});

    // Assert
    expect(result).toBeNull();
  });

  it("returns a new data object rather than the caller's object", () => {
    // Arrange
    const data = { exerciseId: "push-up" };

    // Act
    const result = validateEvent("exercise demo watched", data);

    // Assert
    expect(result?.data).not.toBe(data);
  });
});
