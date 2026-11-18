import { afterEach, describe, expect, it, vi } from "vitest";
import { handlePostExerciseAlternatives } from "@/features/sessions/handle-exercise-alternatives";
import {
  createInMemoryDemoLinkRepository,
  type DemoLinkRepository,
} from "@/features/demos/demo-link-repository";
import { loadExerciseLibrary } from "@/features/sessions/exercise-library";

const SIGNED_IN = async () => ({
  user: { sub: "auth0|swap-test", email: "swap.test@example.com" },
});
const SIGNED_OUT = async () => null;
const JSON_TYPE = "application/json";
const VIDEO_ID = "8yRvm7a8q1Q";
const WIDE_RANGE = { minMinutes: 0, maxMinutes: 90 };

function alternativesRequest(body: unknown, contentType = JSON_TYPE): Request {
  const payload = typeof body === "string" ? body : JSON.stringify(body);
  return new Request("http://localhost/api/exercise-alternatives", {
    method: "POST",
    headers: { "content-type": contentType },
    body: payload,
  });
}

function validBody(overrides: Record<string, unknown> = {}) {
  return {
    exerciseId: "biceps-004",
    currentExerciseIds: ["biceps-004", "biceps-002"],
    ...WIDE_RANGE,
    ...overrides,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("POST /api/exercise-alternatives", () => {
  it("returns 401 UNAUTHENTICATED when signed out", async () => {
    const response = await handlePostExerciseAlternatives(
      alternativesRequest(validBody()),
      SIGNED_OUT,
    );
    const body = await response.json();
    expect(response.status).toBe(401);
    expect(body.error.code).toBe("UNAUTHENTICATED");
  });

  it("returns INVALID_INPUT when the body is not JSON", async () => {
    const response = await handlePostExerciseAlternatives(
      alternativesRequest("hello", "text/plain"),
      SIGNED_IN,
    );
    const body = await response.json();
    expect(body.error.code).toBe("INVALID_INPUT");
    expect(body.error.message).toBe("Send the request as JSON.");
  });

  it("returns INVALID_INPUT when the exercise is not in the library", async () => {
    const response = await handlePostExerciseAlternatives(
      alternativesRequest(validBody({ exerciseId: "nope-999", currentExerciseIds: ["nope-999"] })),
      SIGNED_IN,
    );
    const body = await response.json();
    expect(body.error.code).toBe("INVALID_INPUT");
    expect(body.error.message).toBe("That exercise is not in the library.");
  });

  it("returns INVALID_INPUT when the exercise is not one of the plan's exercises", async () => {
    const response = await handlePostExerciseAlternatives(
      alternativesRequest(
        validBody({ exerciseId: "biceps-001", currentExerciseIds: ["biceps-004"] }),
      ),
      SIGNED_IN,
    );
    const body = await response.json();
    expect(body.error.code).toBe("INVALID_INPUT");
    expect(body.error.message).toBe("Swap an exercise that is in the plan.");
  });

  it("returns only same-type options that are not in the plan, in library order", async () => {
    const response = await handlePostExerciseAlternatives(
      alternativesRequest(validBody()),
      SIGNED_IN,
      createInMemoryDemoLinkRepository(),
    );
    const body = await response.json();
    const expectedIds = loadExerciseLibrary()
      .list()
      .filter((exercise) => exercise.focus === "biceps")
      .map((exercise) => exercise.id)
      .filter((id) => id !== "biceps-004" && id !== "biceps-002");
    const returnedIds = body.data.options.map(
      (option: { exercise: { id: string } }) => option.exercise.id,
    );

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.exerciseId).toBe("biceps-004");
    expect(body.data.focus).toBe("biceps");
    expect(returnedIds).toEqual(expectedIds);
  });

  it("attaches the active demo to each option", async () => {
    const repository = createInMemoryDemoLinkRepository();
    await repository.upsertActive({
      exerciseId: "biceps-001",
      videoId: VIDEO_ID,
      sourceTitle: "Dumbbell curl form",
    });

    const response = await handlePostExerciseAlternatives(
      alternativesRequest(validBody()),
      SIGNED_IN,
      repository,
    );
    const body = await response.json();
    const dumbbell = body.data.options.find(
      (option: { exercise: { id: string } }) => option.exercise.id === "biceps-001",
    );

    expect(dumbbell.exercise.demo).toEqual({ videoId: VIDEO_ID, title: "Dumbbell curl form" });
  });

  it("still returns the options with demo null when the demo lookup fails", async () => {
    const failing = {
      listActiveByExerciseIds: async () => {
        throw new Error("database down");
      },
    } as unknown as DemoLinkRepository;
    vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await handlePostExerciseAlternatives(
      alternativesRequest(validBody()),
      SIGNED_IN,
      failing,
    );
    const body = await response.json();
    const demos = body.data.options.map(
      (option: { exercise: { demo: unknown } }) => option.exercise.demo,
    );

    expect(response.status).toBe(200);
    expect(demos.length).toBeGreaterThan(0);
    expect(demos.every((demo: unknown) => demo === null)).toBe(true);
  });

  it("marks an option unavailable with over_length exactly when its swap would leave the range", async () => {
    // Arrange: the plan is biceps-004 (8 min) plus biceps-001 (7 min) = 15, with a maximum of 15,
    // so a swap is available only when the replacement is 8 minutes or less
    const plan = validBody({
      currentExerciseIds: ["biceps-004", "biceps-001"],
      minMinutes: 0,
      maxMinutes: 15,
    });
    const library = loadExerciseLibrary().list();
    const barbellMinutes = library.find((exercise) => exercise.id === "biceps-004")?.minutes ?? 0;
    const planTotal = 15;

    // Act
    const response = await handlePostExerciseAlternatives(
      alternativesRequest(plan),
      SIGNED_IN,
      createInMemoryDemoLinkRepository(),
    );
    const body = await response.json();

    // Assert
    for (const option of body.data.options) {
      const newTotal = planTotal - barbellMinutes + option.exercise.minutes;
      expect(option.available).toBe(newTotal <= 15);
      expect(option.unavailableReason).toBe(newTotal <= 15 ? null : "over_length");
    }
  });

  it("returns INVALID_INPUT for a length outside 0 to 90 minutes, off the 5-minute step, or with min above max", async () => {
    const cases = [
      { minMinutes: 0, maxMinutes: 120 },
      { minMinutes: 33, maxMinutes: 45 },
      { minMinutes: 50, maxMinutes: 40 },
    ];

    for (const range of cases) {
      const response = await handlePostExerciseAlternatives(
        alternativesRequest(validBody(range)),
        SIGNED_IN,
        createInMemoryDemoLinkRepository(),
      );
      expect((await response.json()).error.code).toBe("INVALID_INPUT");
    }
  });
});
