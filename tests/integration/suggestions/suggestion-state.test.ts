import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { like } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { upsertUser } from "@/features/auth/user-repository";
import {
  getLastShownTemplateId,
  setLastShownTemplateId,
} from "@/features/suggestions/suggestion-state-repository";

const TEST_ID_PREFIX = "test-state-";

async function removeTestUsers(): Promise<void> {
  await getDb()
    .delete(users)
    .where(like(users.id, `${TEST_ID_PREFIX}%`));
}

describe("suggestion state repository", () => {
  beforeEach(async () => {
    await removeTestUsers();
    await upsertUser({ sub: `${TEST_ID_PREFIX}1`, email: "state.test@example.com" });
  });

  afterAll(async () => {
    await removeTestUsers();
  });

  it("returns null before any suggestion has been shown", async () => {
    // Act
    const lastShown = await getLastShownTemplateId(`${TEST_ID_PREFIX}1`);

    // Assert
    expect(lastShown).toBeNull();
  });

  it("stores the last shown template and returns it on the next read", async () => {
    // Act
    await setLastShownTemplateId(`${TEST_ID_PREFIX}1`, "legs-004");
    const lastShown = await getLastShownTemplateId(`${TEST_ID_PREFIX}1`);

    // Assert
    expect(lastShown).toBe("legs-004");
  });

  it("overwrites the previous value on a later update", async () => {
    // Act
    await setLastShownTemplateId(`${TEST_ID_PREFIX}1`, "legs-004");
    await setLastShownTemplateId(`${TEST_ID_PREFIX}1`, "chest-002");
    const lastShown = await getLastShownTemplateId(`${TEST_ID_PREFIX}1`);

    // Assert
    expect(lastShown).toBe("chest-002");
  });
});
