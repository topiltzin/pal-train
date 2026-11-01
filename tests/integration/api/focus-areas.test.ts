import { describe, expect, it } from "vitest";
import { handleListFocusAreas } from "@/features/library/handle-focus-areas";

const FOCUS_COUNT = 10;

describe("GET /api/focus-areas", () => {
  it("returns 401 UNAUTHENTICATED when signed out", async () => {
    // Arrange
    const signedOut = async () => null;

    // Act
    const response = await handleListFocusAreas(signedOut);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(401);
    expect(body.error.code).toBe("UNAUTHENTICATED");
  });

  it("returns every focus area with its label and description when signed in", async () => {
    // Arrange
    const signedIn = async () => ({
      user: { sub: "auth0|focus-test", email: "focus.test@example.com" },
    });

    // Act
    const response = await handleListFocusAreas(signedIn);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(FOCUS_COUNT);
    expect(body.data[0]).toEqual({
      id: "chest",
      label: "Chest",
      description: expect.any(String),
    });
  });
});
