import { describe, expect, it } from "vitest";
import { templateSchema } from "@/features/library/template.schema";

const validTemplate = {
  id: "legs-004",
  name: "Tempo squats and lunges",
  focus: "legs",
  moods: ["energized", "focused"],
  duration_minutes: 30,
  intensity: "high",
  equipment: ["dumbbells"],
  description: "A steady, controlled set to wake your legs up.",
  caution: "Keep your knees tracking over your toes.",
};

describe("templateSchema", () => {
  it("accepts a fully specified template", () => {
    // Act
    const result = templateSchema.safeParse(validTemplate);

    // Assert
    expect(result.success).toBe(true);
  });

  it("rejects a name shorter than 3 characters", () => {
    // Act
    const result = templateSchema.safeParse({ ...validTemplate, name: "ab" });

    // Assert
    expect(result.success).toBe(false);
  });

  it("rejects a name longer than 60 characters", () => {
    // Act
    const result = templateSchema.safeParse({ ...validTemplate, name: "x".repeat(61) });

    // Assert
    expect(result.success).toBe(false);
  });

  it("rejects a duration outside the 10 to 90 minute range", () => {
    // Act
    const tooShort = templateSchema.safeParse({ ...validTemplate, duration_minutes: 9 });
    const tooLong = templateSchema.safeParse({ ...validTemplate, duration_minutes: 91 });

    // Assert
    expect(tooShort.success).toBe(false);
    expect(tooLong.success).toBe(false);
  });

  it("rejects an intensity outside low, moderate, and high", () => {
    // Act
    const result = templateSchema.safeParse({ ...validTemplate, intensity: "extreme" });

    // Assert
    expect(result.success).toBe(false);
  });

  it("rejects an empty moods array", () => {
    // Act
    const result = templateSchema.safeParse({ ...validTemplate, moods: [] });

    // Assert
    expect(result.success).toBe(false);
  });

  it("rejects an unknown mood id", () => {
    // Act
    const result = templateSchema.safeParse({ ...validTemplate, moods: ["sleepy"] });

    // Assert
    expect(result.success).toBe(false);
  });

  it("rejects an empty equipment array; bodyweight must be written as none", () => {
    // Act
    const result = templateSchema.safeParse({ ...validTemplate, equipment: [] });

    // Assert
    expect(result.success).toBe(false);
  });

  it("requires a caution for a high intensity template", () => {
    // Arrange
    const withoutCaution = { ...validTemplate, caution: undefined };

    // Act
    const result = templateSchema.safeParse(withoutCaution);

    // Assert
    expect(result.success).toBe(false);
  });
});
