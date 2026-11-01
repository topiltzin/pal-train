import { describe, expect, it } from "vitest";
import { handleListTemplates } from "@/features/library/handle-templates";

const DEFAULT_LIMIT = 20;
const signedIn = async () => ({
  user: { sub: "auth0|templates-test", email: "templates.test@example.com" },
});
const signedOut = async () => null;

function listRequest(query: string): Request {
  return new Request(`http://localhost/api/templates${query}`);
}

describe("GET /api/templates", () => {
  it("returns 401 UNAUTHENTICATED when signed out", async () => {
    // Act
    const response = await handleListTemplates(listRequest("?focus=cardio"), signedOut);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(401);
    expect(body.error.code).toBe("UNAUTHENTICATED");
  });

  it("returns 400 INVALID_INPUT when focus is missing", async () => {
    // Act
    const response = await handleListTemplates(listRequest(""), signedIn);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(body.error.code).toBe("INVALID_INPUT");
  });

  it("returns 404 NOT_FOUND for an unknown focus area", async () => {
    // Act
    const response = await handleListTemplates(listRequest("?focus=neck"), signedIn);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(404);
    expect(body.error.code).toBe("NOT_FOUND");
  });

  it.each([
    ["an unknown intensity", "?focus=cardio&intensity=extreme"],
    ["maxMinutes below 10", "?focus=cardio&maxMinutes=5"],
    ["maxMinutes above 90", "?focus=cardio&maxMinutes=120"],
    ["limit of 0", "?focus=cardio&limit=0"],
    ["limit above 50", "?focus=cardio&limit=51"],
    ["a negative offset", "?focus=cardio&offset=-1"],
  ])("returns 400 INVALID_INPUT for %s", async (_label, query) => {
    // Act
    const response = await handleListTemplates(listRequest(query), signedIn);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(body.error.code).toBe("INVALID_INPUT");
  });

  it("returns the focus templates with paging meta, using the default limit of 20", async () => {
    // Act
    const response = await handleListTemplates(listRequest("?focus=cardio"), signedIn);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(body.data.every((item: { focus: string }) => item.focus === "cardio")).toBe(true);
    expect(body.data.length).toBeLessThanOrEqual(DEFAULT_LIMIT);
    expect(body.meta).toEqual({
      total: expect.any(Number),
      limit: DEFAULT_LIMIT,
      offset: 0,
    });
    expect(body.meta.total).toBeGreaterThanOrEqual(body.data.length);
  });

  it("filters by intensity", async () => {
    // Act
    const response = await handleListTemplates(
      listRequest("?focus=cardio&intensity=low"),
      signedIn,
    );
    const body = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(body.data.length).toBeGreaterThanOrEqual(1);
    expect(body.data.every((item: { intensity: string }) => item.intensity === "low")).toBe(true);
  });

  it("filters by maxMinutes", async () => {
    // Act
    const response = await handleListTemplates(
      listRequest("?focus=cardio&maxMinutes=20"),
      signedIn,
    );
    const body = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(body.data.every((item: { durationMinutes: number }) => item.durationMinutes <= 20)).toBe(
      true,
    );
  });

  it("applies limit and offset and reports the offset in meta", async () => {
    // Act
    const response = await handleListTemplates(
      listRequest("?focus=cardio&limit=2&offset=2"),
      signedIn,
    );
    const body = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(body.data.length).toBeLessThanOrEqual(2);
    expect(body.meta).toMatchObject({ limit: 2, offset: 2 });
  });
});
