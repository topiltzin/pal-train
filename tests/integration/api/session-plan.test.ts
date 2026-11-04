import { describe, expect, it } from "vitest";
import { handlePostSessionPlan } from "@/features/sessions/handle-session-plan";

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
});
