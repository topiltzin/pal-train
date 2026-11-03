import { afterAll, describe, expect, it } from "vitest";
import { like } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { handlePostSuggestions } from "@/features/suggestions/handle-suggestions";

const TEST_ID_PREFIX = "test-newarea-";
const USER_ID = `${TEST_ID_PREFIX}1`;

const signedIn = async () => ({
  user: { sub: USER_ID, email: "newarea.test@example.com", name: "New Area" },
});

function jsonRequest(body: unknown): Request {
  return new Request("http://localhost/api/suggestions", {
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

afterAll(removeTestUsers);

describe("POST /api/suggestions for the new muscle group options", () => {
  it("returns only shoulder routines for focus shoulders with no mood", async () => {
    const response = await handlePostSuggestions(jsonRequest({ focus: "shoulders" }), signedIn);
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.data.suggestions.length).toBeGreaterThan(0);
    for (const suggestion of body.data.suggestions) {
      expect(suggestion.id.startsWith("shoulders-")).toBe(true);
    }
  });

  it("returns only core routines for focus core with mood calm, or marks the result partial", async () => {
    const response = await handlePostSuggestions(
      jsonRequest({ focus: "core", mood: "calm" }),
      signedIn,
    );
    const body = await response.json();
    expect(response.status).toBe(200);
    for (const suggestion of body.data.suggestions) {
      expect(suggestion.id.startsWith("core-")).toBe(true);
    }
    if (!body.data.partial) {
      expect(body.data.suggestions.length).toBeGreaterThan(0);
    }
  });
});
