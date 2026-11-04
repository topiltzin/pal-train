import { describe, expect, it } from "vitest";
import { attachDemos } from "@/features/demos/attach-demos";
import type { DemoLink } from "@/features/demos/demo-link";

function storedLink(exerciseId: string, videoId: string, sourceTitle: string): DemoLink {
  return {
    id: 1,
    exerciseId,
    videoId,
    sourceTitle,
    channel: "officialdemic",
    active: true,
    addedAt: new Date("2026-11-04T10:00:00Z"),
  };
}

describe("attachDemos", () => {
  it("gives an exercise with an active link its video id and title", () => {
    // Arrange
    const exercises = [{ id: "chest-005", name: "Barbell bench press" }];
    const links = [storedLink("chest-005", "IFzYdoNYJkY", "Bench Press Mistakes")];

    // Act
    const [withDemo] = attachDemos(exercises, links);

    // Assert
    expect(withDemo.demo).toEqual({ videoId: "IFzYdoNYJkY", title: "Bench Press Mistakes" });
  });

  it("gives an exercise without a link a null demo", () => {
    // Arrange
    const exercises = [{ id: "back-002", name: "Lat pulldown" }];

    // Act
    const [withoutDemo] = attachDemos(exercises, []);

    // Assert
    expect(withoutDemo.demo).toBeNull();
  });

  it("keeps every exercise and its own fields", () => {
    // Arrange
    const exercises = [
      { id: "chest-005", name: "Barbell bench press" },
      { id: "back-002", name: "Lat pulldown" },
    ];
    const links = [storedLink("back-002", "5Fcm13Fa8ok", "Lat Pulldown Tips")];

    // Act
    const result = attachDemos(exercises, links);

    // Assert
    expect(result.map((exercise) => exercise.name)).toEqual([
      "Barbell bench press",
      "Lat pulldown",
    ]);
    expect(result[0].demo).toBeNull();
    expect(result[1].demo?.videoId).toBe("5Fcm13Fa8ok");
  });
});
