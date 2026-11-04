import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { eq, like } from "drizzle-orm";
import { importReviewed } from "@/features/demos/import-rows";
import { createDrizzleDemoLinkRepository } from "@/features/demos/drizzle-demo-link-repository";
import { getDb } from "@/lib/db/client";
import { exerciseDemoLinks } from "@/lib/db/schema";

const FIXTURE_PREFIX = "demo-test-import-";
const FIXTURE_CSV = [
  "exercise_id,video_id,source_title,decision,note",
  "demo-test-import-back,5Fcm13Fa8ok,Lat Pulldown Tips,accept,names the movement",
  "demo-test-import-chest,IFzYdoNYJkY,Bench Press Mistakes,accept,names the movement",
  "demo-test-import-legs,r5-pxXn1gd0,Hack Squats,reject,different movement",
].join("\n");

async function removeFixtureRows(): Promise<void> {
  await getDb()
    .delete(exerciseDemoLinks)
    .where(like(exerciseDemoLinks.exerciseId, `${FIXTURE_PREFIX}%`));
}

async function countRows(): Promise<number> {
  const rows = await getDb()
    .select({ id: exerciseDemoLinks.id })
    .from(exerciseDemoLinks)
    .where(like(exerciseDemoLinks.exerciseId, `${FIXTURE_PREFIX}%`));
  return rows.length;
}

describe("importing the reviewed demo links", () => {
  beforeEach(removeFixtureRows);
  afterAll(removeFixtureRows);

  it("stores only the accepted rows on the first run", async () => {
    // Act
    const summary = await importReviewed(FIXTURE_CSV, createDrizzleDemoLinkRepository());

    // Assert
    expect(summary.imported).toBe(2);
    expect(summary.problems).toEqual([]);
    expect(await countRows()).toBe(2);
  });

  it("changes nothing when run a second time", async () => {
    // Arrange
    const repository = createDrizzleDemoLinkRepository();
    await importReviewed(FIXTURE_CSV, repository);
    const rowsAfterFirstRun = await countRows();

    // Act
    const summary = await importReviewed(FIXTURE_CSV, repository);

    // Assert
    expect(summary.imported).toBe(0);
    expect(summary.unchanged).toBe(2);
    expect(await countRows()).toBe(rowsAfterFirstRun);
  });

  it("keeps one active link per exercise after a changed decision is imported", async () => {
    // Arrange
    const repository = createDrizzleDemoLinkRepository();
    await importReviewed(FIXTURE_CSV, repository);
    const changed = FIXTURE_CSV.replace("5Fcm13Fa8ok", "8yRvm7a8q1Q");

    // Act
    await importReviewed(changed, repository);

    // Assert
    const active = await getDb()
      .select()
      .from(exerciseDemoLinks)
      .where(eq(exerciseDemoLinks.exerciseId, "demo-test-import-back"));
    expect(active.filter((row) => row.active)).toHaveLength(1);
    expect(active.find((row) => row.active)?.videoId).toBe("8yRvm7a8q1Q");
  });
});
