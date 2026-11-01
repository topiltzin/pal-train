import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { eq, like } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { upsertUser } from "@/features/auth/user-repository";

const TEST_ID_PREFIX = "test-upsert-";

async function removeTestUsers(): Promise<void> {
  await getDb()
    .delete(users)
    .where(like(users.id, `${TEST_ID_PREFIX}%`));
}

describe("upsertUser", () => {
  beforeEach(async () => {
    await removeTestUsers();
  });

  afterAll(async () => {
    await removeTestUsers();
  });

  it("creates a user on first sign-in", async () => {
    // Arrange
    const claims = { sub: `${TEST_ID_PREFIX}1`, email: "sam@example.com", name: "Sam" };

    // Act
    await upsertUser(claims);

    // Assert
    const rows = await getDb().select().from(users).where(eq(users.id, claims.sub));
    expect(rows).toHaveLength(1);
    expect(rows[0].email).toBe("sam@example.com");
  });

  it("does not duplicate the user on a second sign-in", async () => {
    // Arrange
    const claims = { sub: `${TEST_ID_PREFIX}2`, email: "lee@example.com", name: "Lee" };

    // Act
    await upsertUser(claims);
    await upsertUser(claims);

    // Assert
    const rows = await getDb().select().from(users).where(eq(users.id, claims.sub));
    expect(rows).toHaveLength(1);
  });

  it("falls back to the email local part when no name is provided", async () => {
    // Arrange
    const claims = { sub: `${TEST_ID_PREFIX}3`, email: "jordan.k@example.com" };

    // Act
    const user = await upsertUser(claims);

    // Assert
    expect(user.displayName).toBe("jordan.k");
  });

  it("truncates a display name longer than 40 characters", async () => {
    // Arrange
    const claims = { sub: `${TEST_ID_PREFIX}4`, email: "long@example.com", name: "x".repeat(60) };

    // Act
    const user = await upsertUser(claims);

    // Assert
    expect(user.displayName).toHaveLength(40);
  });
});
