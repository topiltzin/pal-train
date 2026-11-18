import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import {
  countRecentRequests,
  deleteResetTokens,
  recordRequest,
} from "@/features/auth/password-reset-requests";
import { getDb } from "@/lib/db/client";
import { passwordResetRequests, user, verification } from "@/lib/db/schema";

const MINUTE_MS = 60_000;

// A Better Auth account is needed because the request table references it.
async function temporaryAccount() {
  const id = `reset-test-${randomUUID()}`;
  await getDb()
    .insert(user)
    .values({
      id,
      name: "Reset Test",
      email: `${id}@example.test`,
      emailVerified: false,
    });
  return id;
}

const createdIds: string[] = [];

afterEach(async () => {
  const db = getDb();
  for (const id of createdIds.splice(0)) {
    await db.delete(verification).where(eq(verification.value, id));
    await db.delete(user).where(eq(user.id, id));
  }
});

describe("password reset request repository", () => {
  it("counts only the requests recorded inside the last hour", async () => {
    // Arrange
    const userId = await temporaryAccount();
    createdIds.push(userId);
    const now = new Date();
    await recordRequest(userId, new Date(now.getTime() - 10 * MINUTE_MS));
    await recordRequest(userId, new Date(now.getTime() - 90 * MINUTE_MS));

    // Act
    const times = await countRecentRequests(userId, now);

    // Assert
    expect(times).toHaveLength(1);
  });

  it("keeps each account's requests separate", async () => {
    // Arrange
    const first = await temporaryAccount();
    const second = await temporaryAccount();
    createdIds.push(first, second);
    await recordRequest(first, new Date());

    // Act
    const times = await countRecentRequests(second, new Date());

    // Assert
    expect(times).toHaveLength(0);
  });

  it("deletes only the account's reset tokens, leaving other verification rows alone", async () => {
    // Arrange
    const userId = await temporaryAccount();
    const otherId = await temporaryAccount();
    createdIds.push(userId, otherId);
    const db = getDb();
    const expiresAt = new Date(Date.now() + 60 * MINUTE_MS);
    await db.insert(verification).values([
      { id: randomUUID(), identifier: `reset-password:${randomUUID()}`, value: userId, expiresAt },
      { id: randomUUID(), identifier: `reset-password:${randomUUID()}`, value: otherId, expiresAt },
      { id: randomUUID(), identifier: "email-verification", value: userId, expiresAt },
    ]);

    // Act
    await deleteResetTokens(userId);

    // Assert
    const remaining = await db.select().from(verification).where(eq(verification.value, userId));
    expect(remaining.map((row) => row.identifier)).toEqual(["email-verification"]);
    const others = await db.select().from(verification).where(eq(verification.value, otherId));
    expect(others).toHaveLength(1);
  });

  it("removes an account's request rows when the account is deleted", async () => {
    // Arrange, Act
    const userId = await temporaryAccount();
    await recordRequest(userId, new Date());
    await getDb().delete(user).where(eq(user.id, userId));

    // Assert
    const rows = await getDb()
      .select()
      .from(passwordResetRequests)
      .where(eq(passwordResetRequests.userId, userId));
    expect(rows).toHaveLength(0);
  });
});
