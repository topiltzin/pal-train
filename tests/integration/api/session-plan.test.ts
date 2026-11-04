import { describe, expect, it, vi } from "vitest";
import { handlePostSessionPlan } from "@/features/sessions/handle-session-plan";
import { createInMemoryDemoLinkRepository, type DemoLinkRepository } from "@/features/demos/demo-link-repository";
import { loadExerciseLibrary } from "@/features/sessions/exercise-library";

const SIGNED_IN = async () => ({
  user: { sub: "auth0|plan-test", email: "plan.test@example.com" },
});
const SIGNED_OUT = async () => null;
const JSON_TYPE = "application/json";

function planRequest(body: unknown, contentType = JSON_TYPE): Request {
  const payload = typeof body === "string" ? body : JSON.stringify(body);
  return new Request("http://localhost/api/session-plan", {
    method: "POST",
    headers: { "content-type": contentType },
    body: payload,
  });
}

const VALID_BODY = { minMinutes: 30, maxMinutes: 45, mood: "energized", focus: "chest" };

describe("POST /api/session-plan", () => {
  it("returns 401 UNAUTHENTICATED when signed out", async () => {
    const response = await handlePostSessionPlan(planRequest(VALID_BODY), SIGNED_OUT);
    const body = await response.json();
    expect(response.status).toBe(401);
    expect(body.error.code).toBe("UNAUTHENTICATED");
  });

  it("returns INVALID_INPUT when the body is not JSON", async () => {
    const response = await handlePostSessionPlan(
      planRequest("hello", "text/plain"),
      SIGNED_IN,
    );
    const body = await response.json();
    expect(body.error.code).toBe("INVALID_INPUT");
    expect(body.error.message).toBe("Send the request as JSON.");
  });

  it("returns INVALID_INPUT when the minimum is above the maximum", async () => {
    const response = await handlePostSessionPlan(
      planRequest({ ...VALID_BODY, minMinutes: 50, maxMinutes: 40 }),
      SIGNED_IN,
    );
    expect((await response.json()).error.code).toBe("INVALID_INPUT");
  });

  it("returns INVALID_INPUT when a length is not a multiple of 5", async () => {
    const response = await handlePostSessionPlan(
      planRequest({ ...VALID_BODY, minMinutes: 33 }),
      SIGNED_IN,
    );
    expect((await response.json()).error.code).toBe("INVALID_INPUT");
  });

  it("returns INVALID_INPUT when the maximum is above 90 minutes", async () => {
    const response = await handlePostSessionPlan(
      planRequest({ ...VALID_BODY, maxMinutes: 120 }),
      SIGNED_IN,
    );
    expect((await response.json()).error.code).toBe("INVALID_INPUT");
  });

  it("returns INVALID_INPUT when neither mood nor focus is given", async () => {
    const response = await handlePostSessionPlan(
      planRequest({ minMinutes: 30, maxMinutes: 45 }),
      SIGNED_IN,
    );
    const body = await response.json();
    expect(body.error.code).toBe("INVALID_INPUT");
    expect(body.error.message).toBe("Pick a mood, a focus area, or both.");
  });

  it("returns the success envelope with a plan inside the range", async () => {
    const response = await handlePostSessionPlan(planRequest(VALID_BODY), SIGNED_IN);
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data.exercises)).toBe(true);
    expect(body.data).toEqual(
      expect.objectContaining({
        targetCount: expect.any(Number),
        partial: expect.any(Boolean),
      }),
    );
    if (body.data.partial) {
      expect(typeof body.data.shortfallMessage).toBe("string");
    }
    if (!body.data.partial) {
      expect(body.data.exercises.length).toBeGreaterThanOrEqual(3);
      expect(body.data.totalMinutes).toBeLessThanOrEqual(45);
    }
  });
});

describe("POST /api/session-plan count scaling", () => {
  it("plans more exercises for a 90-minute range than for a 10-minute range", async () => {
    const countFor = async (minMinutes: number, maxMinutes: number) => {
      const response = await handlePostSessionPlan(
        planRequest({ minMinutes, maxMinutes, mood: "energized", focus: "chest" }),
        SIGNED_IN,
      );
      return (await response.json()).data.exercises.length as number;
    };

    const shortCount = await countFor(10, 10);
    const longCount = await countFor(60, 90);

    expect(longCount).toBeGreaterThan(shortCount);
  });

  it("returns INVALID_INPUT when a tired session is longer than 45 minutes", async () => {
    const response = await handlePostSessionPlan(
      planRequest({ minMinutes: 0, maxMinutes: 60, mood: "tired" }),
      SIGNED_IN,
    );
    const body = await response.json();
    expect(response.status).toBe(400);
    expect(body.error.code).toBe("INVALID_INPUT");
    expect(body.error.message).toBe("Sessions for this mood stay at 45 minutes or less.");
  });

  it("returns INVALID_INPUT when the longest session is under 10 minutes", async () => {
    const response = await handlePostSessionPlan(
      planRequest({ minMinutes: 0, maxMinutes: 5, mood: "energized" }),
      SIGNED_IN,
    );
    const body = await response.json();
    expect(response.status).toBe(400);
    expect(body.error.code).toBe("INVALID_INPUT");
    expect(body.error.message).toBe("Plan at least 10 minutes.");
  });

  it("returns each planned exercise with its active demo", async () => {
    // Arrange: a link for every exercise in the library
    const demoLinks = createInMemoryDemoLinkRepository();
    for (const exercise of loadExerciseLibrary().list()) {
      await demoLinks.upsertActive({ exerciseId: exercise.id, videoId: "IFzYdoNYJkY", sourceTitle: "Demo" });
    }

    // Act
    const response = await handlePostSessionPlan(planRequest(VALID_BODY), SIGNED_IN, demoLinks);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(body.data.exercises.length).toBeGreaterThan(0);
    for (const exercise of body.data.exercises) {
      expect(exercise.demo).toEqual({ videoId: "IFzYdoNYJkY", title: "Demo" });
    }
  });

  it("still returns the plan, with no demos, when the demo lookup fails", async () => {
    // Arrange
    const failingDemoLinks: DemoLinkRepository = {
      listActiveByExerciseIds: async () => {
        throw new Error("database unavailable");
      },
      upsertActive: async () => {
        throw new Error("database unavailable");
      },
      deactivate: async () => undefined,
    };
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => undefined);

    // Act
    const response = await handlePostSessionPlan(planRequest(VALID_BODY), SIGNED_IN, failingDemoLinks);
    const body = await response.json();
    const failureWasLogged = errorLog.mock.calls.length > 0;
    errorLog.mockRestore();

    // Assert
    expect(response.status).toBe(200);
    expect(body.data.exercises.every((exercise: { demo: unknown }) => exercise.demo === null)).toBe(true);
    expect(failureWasLogged).toBe(true);
  });

  it("returns no demo for an exercise once its link is deactivated", async () => {
    // Arrange: a link for every exercise, then deactivate them all
    const demoLinks = createInMemoryDemoLinkRepository();
    const exerciseIds = loadExerciseLibrary().list().map((exercise) => exercise.id);
    for (const exerciseId of exerciseIds) {
      await demoLinks.upsertActive({ exerciseId, videoId: "IFzYdoNYJkY", sourceTitle: "Demo" });
      await demoLinks.deactivate(exerciseId);
    }

    // Act
    const response = await handlePostSessionPlan(planRequest(VALID_BODY), SIGNED_IN, demoLinks);
    const body = await response.json();

    // Assert
    expect(body.data.exercises.length).toBeGreaterThan(0);
    expect(body.data.exercises.every((exercise: { demo: unknown }) => exercise.demo === null)).toBe(true);
  });
});
