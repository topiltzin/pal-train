import { describe, expect, it } from "vitest";
import { handleGetTemplate } from "@/features/library/handle-templates";
import { loadLibrary } from "@/features/library/library-repository";

const signedIn = async () => ({
  user: { sub: "auth0|template-detail-test", email: "detail.test@example.com" },
});
const signedOut = async () => null;

describe("GET /api/templates/{id}", () => {
  it("returns 401 UNAUTHENTICATED when signed out", async () => {
    // Arrange
    const knownId = loadLibrary().list()[0].id;

    // Act
    const response = await handleGetTemplate(knownId, signedOut);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(401);
    expect(body.error.code).toBe("UNAUTHENTICATED");
  });

  it("returns 200 with the template for a known id", async () => {
    // Arrange
    const knownTemplate = loadLibrary().list()[0];

    // Act
    const response = await handleGetTemplate(knownTemplate.id, signedIn);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toMatchObject({
      id: knownTemplate.id,
      name: knownTemplate.name,
      focus: knownTemplate.focus,
      durationMinutes: knownTemplate.duration_minutes,
      intensity: knownTemplate.intensity,
    });
  });

  it("returns 404 NOT_FOUND for an unknown id", async () => {
    // Act
    const response = await handleGetTemplate("no-such-template-999", signedIn);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(404);
    expect(body.error.code).toBe("NOT_FOUND");
  });
});
