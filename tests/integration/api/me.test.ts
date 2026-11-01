import { afterAll, describe, expect, it } from "vitest";
import { like } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { handleGetMe } from "@/features/auth/me";

const TEST_ID_PREFIX = "test-me-";

async function removeTestUsers(): Promise<void> {
  await getDb()
    .delete(users)
    .where(like(users.id, `${TEST_ID_PREFIX}%`));
}

afterAll(async () => {
  await removeTestUsers();
});

describe("GET /api/me", () => {
  it("returns 401 UNAUTHENTICATED in the envelope when signed out", async () => {
    // Arrange
    const signedOut = async () => null;

    // Act
    const response = await handleGetMe(signedOut);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(401);
    expect(body).toMatchObject({
      success: false,
      data: null,
      error: { code: "UNAUTHENTICATED" },
    });
  });

  it("returns the signed-in user with the display name in the envelope", async () => {
    // Arrange
    const signedIn = async () => ({
      user: { sub: `${TEST_ID_PREFIX}1`, email: "me.test@example.com", name: "Riley" },
    });

    // Act
    const response = await handleGetMe(signedIn);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      success: true,
      error: null,
      data: { id: `${TEST_ID_PREFIX}1`, displayName: "Riley", email: "me.test@example.com" },
    });
  });
});
