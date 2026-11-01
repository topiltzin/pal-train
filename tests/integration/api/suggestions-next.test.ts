import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { like } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { upsertUser } from "@/features/auth/user-repository";
import { handleNextSuggestions } from "@/features/suggestions/handle-suggestions-next";
import { getLastShownTemplateId } from "@/features/suggestions/suggestion-state-repository";
import { handlePostSuggestions } from "@/features/suggestions/handle-suggestions";

const TEST_ID_PREFIX = "test-next-";
const USER_ID = `${TEST_ID_PREFIX}1`;
const SHUFFLE_ROUNDS = 6;

const signedIn = async () => ({
  user: { sub: USER_ID, email: "next.test@example.com", name: "Next" },
});
const signedOut = async () => null;

function jsonRequest(url: string, body: unknown): Request {
  return new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function removeTestUsers(): Promise<void> {
  await getDb()
    .delete(users)
    .where(like(users.id, `${TEST_ID_PREFIX}%`));
}

describe("POST /api/suggestions/next", () => {
  beforeEach(async () => {
    await removeTestUsers();
    await upsertUser({ sub: USER_ID, email: "next.test@example.com", name: "Next" });
  });

  afterAll(async () => {
    await removeTestUsers();
  });

  it("returns 401 UNAUTHENTICATED when signed out", async () => {
    // Act
    const response = await handleNextSuggestions(
      jsonRequest("http://localhost/api/suggestions/next", { mood: "energized" }),
      signedOut,
    );
    const body = await response.json();

    // Assert
    expect(response.status).toBe(401);
    expect(body.error.code).toBe("UNAUTHENTICATED");
  });

  it("never returns the last shown template first when alternatives exist", async () => {
    // Arrange: show an initial set so there is a last shown template
    await handlePostSuggestions(
      jsonRequest("http://localhost/api/suggestions", { mood: "energized" }),
      signedIn,
    );

    for (let round = 0; round < SHUFFLE_ROUNDS; round += 1) {
      const lastShown = await getLastShownTemplateId(USER_ID);

      // Act
      const response = await handleNextSuggestions(
        jsonRequest("http://localhost/api/suggestions/next", { mood: "energized" }),
        signedIn,
      );
      const body = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(body.data.suggestions[0].id).not.toBe(lastShown);
    }
  });

  it("records the new last shown template after returning suggestions", async () => {
    // Act
    const response = await handleNextSuggestions(
      jsonRequest("http://localhost/api/suggestions/next", { focus: "back" }),
      signedIn,
    );
    const body = await response.json();

    // Assert
    expect(await getLastShownTemplateId(USER_ID)).toBe(body.data.suggestions.at(-1).id);
  });
});
