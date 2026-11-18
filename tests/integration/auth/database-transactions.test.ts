import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { getDb } from "@/lib/db/client";
import { users } from "@/lib/db/schema";

const ROLLBACK_MESSAGE = "forced failure after the insert";

// Each run uses its own id and email, so leftover rows from an earlier run cannot interfere.
function temporaryUser() {
  const id = `tx-test-${randomUUID()}`;
  return { id, email: `${id}@example.test`, displayName: "Transaction Test" };
}

const createdIds: string[] = [];

afterEach(async () => {
  const db = getDb();
  for (const id of createdIds.splice(0)) {
    await db.delete(users).where(eq(users.id, id));
  }
});

describe("database transactions", () => {
  it("keeps the row when the transaction commits", async () => {
    // Arrange
    const db = getDb();
    const user = temporaryUser();
    createdIds.push(user.id);

    // Act
    await db.transaction(async (tx) => {
      await tx.insert(users).values(user);
    });

    // Assert
    const rows = await db.select().from(users).where(eq(users.id, user.id));
    expect(rows).toHaveLength(1);
  });

  it("leaves no row behind when the transaction throws after writing", async () => {
    // Arrange
    const db = getDb();
    const user = temporaryUser();
    createdIds.push(user.id);

    // Act
    await expect(
      db.transaction(async (tx) => {
        await tx.insert(users).values(user);
        throw new Error(ROLLBACK_MESSAGE);
      }),
    ).rejects.toThrow(ROLLBACK_MESSAGE);

    // Assert
    const rows = await db.select().from(users).where(eq(users.id, user.id));
    expect(rows).toHaveLength(0);
  });
});
