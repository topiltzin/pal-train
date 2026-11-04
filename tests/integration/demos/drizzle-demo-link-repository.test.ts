import { afterAll } from "vitest";
import { like } from "drizzle-orm";
import { describeDemoLinkRepository } from "../../unit/demos/demo-link-repository.contract";
import { createDrizzleDemoLinkRepository } from "@/features/demos/drizzle-demo-link-repository";
import { getDb } from "@/lib/db/client";
import { exerciseDemoLinks } from "@/lib/db/schema";

const TEST_EXERCISE_PREFIX = "contract-";

async function removeTestRows(): Promise<void> {
  await getDb()
    .delete(exerciseDemoLinks)
    .where(like(exerciseDemoLinks.exerciseId, `${TEST_EXERCISE_PREFIX}%`));
}

describeDemoLinkRepository("drizzle", () => ({
  repository: createDrizzleDemoLinkRepository(),
  reset: removeTestRows,
}));

afterAll(removeTestRows);
