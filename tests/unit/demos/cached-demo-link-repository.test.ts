import { describe, expect, it } from "vitest";
import { createInMemoryDemoLinkRepository } from "@/features/demos/demo-link-repository";
import { withLinkCache } from "@/features/demos/cached-demo-link-repository";

const LINK = { exerciseId: "back-002", videoId: "5Fcm13Fa8ok", sourceTitle: "Lat Pulldown Tips" };

function countingRepository() {
  const inner = createInMemoryDemoLinkRepository();
  let lookups = 0;
  return {
    repository: {
      ...inner,
      async listActiveByExerciseIds(ids: readonly string[]) {
        lookups += 1;
        return inner.listActiveByExerciseIds(ids);
      },
    },
    inner,
    lookups: () => lookups,
  };
}

describe("withLinkCache", () => {
  it("answers a repeat lookup for the same exercise without asking the database again", async () => {
    // Arrange
    const { repository, inner, lookups } = countingRepository();
    await inner.upsertActive(LINK);
    const cached = withLinkCache(repository, 60_000, () => 0);
    await cached.listActiveByExerciseIds(["back-002"]);

    // Act
    const links = await cached.listActiveByExerciseIds(["back-002"]);

    // Assert
    expect(links).toHaveLength(1);
    expect(lookups()).toBe(1);
  });

  it("asks the database again once the cached entry has expired", async () => {
    // Arrange
    let clock = 0;
    const { repository, lookups } = countingRepository();
    const cached = withLinkCache(repository, 1_000, () => clock);
    await cached.listActiveByExerciseIds(["back-002"]);

    // Act
    clock = 1_000;
    await cached.listActiveByExerciseIds(["back-002"]);

    // Assert
    expect(lookups()).toBe(2);
  });

  it("only asks the database for exercises it has not seen yet", async () => {
    // Arrange
    const { repository, lookups } = countingRepository();
    const cached = withLinkCache(repository, 60_000, () => 0);
    await cached.listActiveByExerciseIds(["back-002"]);

    // Act
    await cached.listActiveByExerciseIds(["back-002", "chest-005"]);

    // Assert
    expect(lookups()).toBe(2);
  });

  it("returns the new link right after an upsert, not the old cached one", async () => {
    // Arrange
    const { repository, lookups } = countingRepository();
    const cached = withLinkCache(repository, 60_000, () => 0);
    await cached.listActiveByExerciseIds(["back-002"]);

    // Act
    await cached.upsertActive({ ...LINK, videoId: "8yRvm7a8q1Q" });
    const links = await cached.listActiveByExerciseIds(["back-002"]);

    // Assert
    expect(links.map((link) => link.videoId)).toEqual(["8yRvm7a8q1Q"]);
    expect(lookups()).toBe(2);
  });

  it("does not cache a failed lookup, so the next request tries again", async () => {
    // Arrange
    let attempts = 0;
    const repository = {
      ...createInMemoryDemoLinkRepository(),
      async listActiveByExerciseIds(): Promise<never[]> {
        attempts += 1;
        if (attempts === 1) throw new Error("database unavailable");
        return [];
      },
    };
    const cached = withLinkCache(repository, 60_000, () => 0);
    await expect(cached.listActiveByExerciseIds(["back-002"])).rejects.toThrow();

    // Act
    await cached.listActiveByExerciseIds(["back-002"]);

    // Assert
    expect(attempts).toBe(2);
  });
});
