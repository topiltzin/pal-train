import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { and, eq, like } from "drizzle-orm";
import { createDrizzleDemoLinkRepository } from "@/features/demos/drizzle-demo-link-repository";
import { getDb } from "@/lib/db/client";
import { exerciseDemoLinks } from "@/lib/db/schema";

const TEST_EXERCISE = "demo-test-replace-chest";
const TEST_PREFIX = "demo-test-replace-";

async function removeTestRows(): Promise<void> {
  await getDb()
    .delete(exerciseDemoLinks)
    .where(like(exerciseDemoLinks.exerciseId, `${TEST_PREFIX}%`));
}

async function rowsFor(exerciseId: string) {
  return getDb()
    .select()
    .from(exerciseDemoLinks)
    .where(eq(exerciseDemoLinks.exerciseId, exerciseId))
    .orderBy(exerciseDemoLinks.id);
}

describe("replacing an exercise's demo link in the database", () => {
  beforeEach(removeTestRows);
  afterAll(removeTestRows);

  it("keeps exactly one active row for the exercise, and it is the newer one", async () => {
    // Arrange
    const repository = createDrizzleDemoLinkRepository();
    await repository.upsertActive({
      exerciseId: TEST_EXERCISE,
      videoId: "AAAAAAAAAAA",
      sourceTitle: "Old",
    });

    // Act
    await repository.upsertActive({
      exerciseId: TEST_EXERCISE,
      videoId: "CCCCCCCCCCC",
      sourceTitle: "New",
    });

    // Assert
    const rows = await rowsFor(TEST_EXERCISE);
    expect(rows).toHaveLength(2);
    expect(rows.filter((row) => row.active)).toHaveLength(1);
    expect(rows.find((row) => row.active)?.videoId).toBe("CCCCCCCCCCC");
    expect(rows.find((row) => !row.active)?.videoId).toBe("AAAAAAAAAAA");
  });

  it("keeps the older row as history with active set to false", async () => {
    // Arrange
    const repository = createDrizzleDemoLinkRepository();
    await repository.upsertActive({
      exerciseId: TEST_EXERCISE,
      videoId: "AAAAAAAAAAA",
      sourceTitle: "Old",
    });

    // Act
    await repository.upsertActive({
      exerciseId: TEST_EXERCISE,
      videoId: "CCCCCCCCCCC",
      sourceTitle: "New",
    });

    // Assert
    const [older] = await getDb()
      .select()
      .from(exerciseDemoLinks)
      .where(
        and(
          eq(exerciseDemoLinks.exerciseId, TEST_EXERCISE),
          eq(exerciseDemoLinks.videoId, "AAAAAAAAAAA"),
        ),
      );
    expect(older.active).toBe(false);
  });

  it("rejects a second active row for the same exercise at the database level", async () => {
    // Arrange
    const repository = createDrizzleDemoLinkRepository();
    await repository.upsertActive({
      exerciseId: TEST_EXERCISE,
      videoId: "AAAAAAAAAAA",
      sourceTitle: "Only",
    });

    // Act / Assert: a direct insert that bypasses the repository must still fail
    await expect(
      getDb().insert(exerciseDemoLinks).values({
        exerciseId: TEST_EXERCISE,
        videoId: "DDDDDDDDDDD",
        sourceTitle: "Direct",
        active: true,
      }),
    ).rejects.toThrow();
  });
});
