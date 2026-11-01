import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { like } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { upsertUser } from "@/features/auth/user-repository";
import { createLibraryRepository, loadLibrary } from "@/features/library/library-repository";
import { handlePostSuggestions } from "@/features/suggestions/handle-suggestions";
import type { Template } from "@/features/library/template.schema";

vi.mock("@/features/library/library-repository", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/library/library-repository")>();
  return { ...actual, loadLibrary: vi.fn(actual.loadLibrary) };
});

const TEST_ID_PREFIX = "test-focus-";
const USER_ID = `${TEST_ID_PREFIX}1`;
const MAX_SUGGESTIONS = 3;

const signedIn = async () => ({
  user: { sub: USER_ID, email: "focus.suggest@example.com", name: "Focus" },
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

function stubTemplate(overrides: Pick<Template, "id" | "focus" | "moods">): Template {
  return {
    name: "Stub idea",
    duration_minutes: 20,
    intensity: "moderate",
    equipment: ["none"],
    description: "A stub workout idea.",
    ...overrides,
  };
}

describe("POST /api/suggestions with a focus area", () => {
  beforeEach(async () => {
    await removeTestUsers();
    await upsertUser({ sub: USER_ID, email: "focus.suggest@example.com", name: "Focus" });
  });

  afterAll(async () => {
    await removeTestUsers();
  });

  it("returns only templates for the focus when no mood is given", async () => {
    // Act
    const response = await handlePostSuggestions(jsonRequest({ focus: "back" }), signedIn);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(body.data.partial).toBe(false);
    expect(body.data.suggestions.length).toBeGreaterThanOrEqual(1);
    expect(body.data.suggestions.length).toBeLessThanOrEqual(MAX_SUGGESTIONS);
    expect(body.data.suggestions.every((item: { focus: string }) => item.focus === "back")).toBe(
      true,
    );
  });

  it("returns only templates matching both the mood and the focus", async () => {
    // Act
    const response = await handlePostSuggestions(
      jsonRequest({ mood: "focused", focus: "back" }),
      signedIn,
    );
    const body = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(body.data.partial).toBe(false);
    expect(body.data.suggestions.length).toBeGreaterThanOrEqual(1);
    for (const item of body.data.suggestions) {
      expect(item.focus).toBe("back");
      expect(item.moods).toContain("focused");
    }
  });

  it("returns the closest matches with partial true when nothing matches both", async () => {
    // Arrange: a stub library where no template is both "focused" and "back"
    vi.mocked(loadLibrary).mockReturnValueOnce(
      createLibraryRepository([
        stubTemplate({ id: "chest-001", focus: "chest", moods: ["energized"] }),
        stubTemplate({ id: "back-001", focus: "back", moods: ["tired"] }),
      ]),
    );

    // Act
    const response = await handlePostSuggestions(
      jsonRequest({ mood: "focused", focus: "back" }),
      signedIn,
    );
    const body = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(body.data.partial).toBe(true);
    expect(body.data.suggestions.map((item: { id: string }) => item.id)).toEqual(["back-001"]);
  });

  it("returns 400 INVALID_INPUT for an unknown focus area", async () => {
    // Act
    const response = await handlePostSuggestions(jsonRequest({ focus: "neck" }), signedIn);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(body.error.code).toBe("INVALID_INPUT");
  });
});
