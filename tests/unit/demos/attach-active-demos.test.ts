import { afterEach, describe, expect, it, vi } from "vitest";
import { attachActiveDemos } from "@/features/demos/attach-active-demos";
import {
  createInMemoryDemoLinkRepository,
  type DemoLinkRepository,
} from "@/features/demos/demo-link-repository";

const LOG_LABEL = "TEST /api/example";
const VIDEO_ID = "8yRvm7a8q1Q";
const EXERCISES = [
  { id: "biceps-001", name: "Dumbbell curl" },
  { id: "biceps-002", name: "Hammer curl" },
];

afterEach(() => {
  vi.restoreAllMocks();
});

describe("attachActiveDemos", () => {
  it("attaches the active demo for each exercise that has one", async () => {
    // Arrange
    const repository = createInMemoryDemoLinkRepository();
    await repository.upsertActive({
      exerciseId: "biceps-002",
      videoId: VIDEO_ID,
      sourceTitle: "Hammer curl form",
    });

    // Act
    const result = await attachActiveDemos(
      EXERCISES,
      repository,
      ["biceps-001", "biceps-002"],
      LOG_LABEL,
    );

    // Assert
    expect(result[0].demo).toBeNull();
    expect(result[1].demo).toEqual({ videoId: VIDEO_ID, title: "Hammer curl form" });
  });

  it("returns every exercise with demo null and logs when the lookup fails", async () => {
    // Arrange
    const failing: DemoLinkRepository = {
      listActiveByExerciseIds: async () => {
        throw new Error("database down");
      },
    } as unknown as DemoLinkRepository;
    const logSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    // Act
    const result = await attachActiveDemos(EXERCISES, failing, ["biceps-001"], LOG_LABEL);

    // Assert
    expect(result).toEqual([
      { id: "biceps-001", name: "Dumbbell curl", demo: null },
      { id: "biceps-002", name: "Hammer curl", demo: null },
    ]);
    expect(logSpy).toHaveBeenCalledWith(`${LOG_LABEL} demo lookup failed`, expect.any(Error));
  });
});
