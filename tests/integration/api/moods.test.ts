import { describe, expect, it } from "vitest";
import { handleListMoods } from "@/features/moods/handle-moods";

const MOOD_COUNT = 8;

describe("GET /api/moods", () => {
  it("returns 401 UNAUTHENTICATED when signed out", async () => {
    // Arrange
    const signedOut = async () => null;

    // Act
    const response = await handleListMoods(signedOut);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(401);
    expect(body.error.code).toBe("UNAUTHENTICATED");
  });

  it("returns every mood with its buddy line when signed in", async () => {
    // Arrange
    const signedIn = async () => ({
      user: { sub: "auth0|moods-test", email: "moods.test@example.com" },
    });

    // Act
    const response = await handleListMoods(signedIn);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(body.data).toHaveLength(MOOD_COUNT);
    expect(body.data[0]).toMatchObject({
      id: "energized",
      label: "Energized",
      intensityRange: "high",
    });
    expect(body.data[0].buddyLine).toEqual(expect.any(String));
  });
});
