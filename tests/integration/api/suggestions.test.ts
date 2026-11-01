import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { like } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { upsertUser } from "@/features/auth/user-repository";
import { getLastShownTemplateId } from "@/features/suggestions/suggestion-state-repository";
import { handlePostSuggestions } from "@/features/suggestions/handle-suggestions";

const TEST_ID_PREFIX = "test-suggest-";
const USER_ID = `${TEST_ID_PREFIX}1`;
const MAX_SUGGESTIONS = 3;

const signedIn = async () => ({
  user: { sub: USER_ID, email: "suggest.test@example.com", name: "Suggest" },
});
const signedOut = async () => null;

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

describe("POST /api/suggestions", () => {
  beforeEach(async () => {
    await removeTestUsers();
    await upsertUser({ sub: USER_ID, email: "suggest.test@example.com", name: "Suggest" });
  });

  afterAll(async () => {
    await removeTestUsers();
  });

  it("returns 401 UNAUTHENTICATED when signed out", async () => {
    // Act
    const response = await handlePostSuggestions(jsonRequest({ mood: "energized" }), signedOut);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(401);
    expect(body.error.code).toBe("UNAUTHENTICATED");
  });

  it("returns 400 INVALID_INPUT when neither mood nor focus is given", async () => {
    // Act
    const response = await handlePostSuggestions(jsonRequest({}), signedIn);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(body.error.code).toBe("INVALID_INPUT");
  });

  it("returns 400 INVALID_INPUT for an unknown mood", async () => {
    // Act
    const response = await handlePostSuggestions(jsonRequest({ mood: "sleepy" }), signedIn);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(body.error.code).toBe("INVALID_INPUT");
  });

  it("returns 400 INVALID_INPUT when the body is sent as text/plain, not JSON", async () => {
    // Arrange: a cross-site form can send JSON-looking text as text/plain (CSRF hardening, F2)
    const request = new Request("http://localhost/api/suggestions", {
      method: "POST",
      headers: { "content-type": "text/plain" },
      body: JSON.stringify({ mood: "energized" }),
    });

    // Act
    const response = await handlePostSuggestions(request, signedIn);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(body.error.code).toBe("INVALID_INPUT");
  });

  it("returns 400 INVALID_INPUT when the body is not JSON", async () => {
    // Arrange
    const request = new Request("http://localhost/api/suggestions", {
      method: "POST",
      body: "not json",
    });

    // Act
    const response = await handlePostSuggestions(request, signedIn);

    // Assert
    expect(response.status).toBe(400);
  });

  it("returns one to three suggestions in the envelope for a valid mood", async () => {
    // Act
    const response = await handlePostSuggestions(jsonRequest({ mood: "energized" }), signedIn);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.suggestions.length).toBeGreaterThanOrEqual(1);
    expect(body.data.suggestions.length).toBeLessThanOrEqual(MAX_SUGGESTIONS);
    expect(body.data.suggestions[0]).toMatchObject({
      durationMinutes: expect.any(Number),
      intensity: expect.any(String),
      equipment: expect.any(Array),
    });
  });

  it("records the last suggestion returned as the user's last shown template", async () => {
    // Act
    const response = await handlePostSuggestions(jsonRequest({ mood: "tired" }), signedIn);
    const body = await response.json();
    const lastReturned = body.data.suggestions.at(-1).id;

    // Assert
    expect(await getLastShownTemplateId(USER_ID)).toBe(lastReturned);
  });
});
