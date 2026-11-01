import { describe, expect, it } from "vitest";
import { getCurrentUser, requireUser, UnauthenticatedError } from "@/features/auth/session";

const SIGNED_IN_SESSION = {
  user: { sub: "auth0|abc123", email: "sam@example.com", name: "Sam" },
};

describe("requireUser", () => {
  it("throws UnauthenticatedError when the visitor is signed out", async () => {
    // Arrange
    const signedOut = async () => null;

    // Act / Assert
    await expect(requireUser(signedOut)).rejects.toBeInstanceOf(UnauthenticatedError);
  });

  it("returns the signed-in user's claims when a session exists", async () => {
    // Arrange
    const signedIn = async () => SIGNED_IN_SESSION;

    // Act
    const user = await requireUser(signedIn);

    // Assert
    expect(user).toEqual({ sub: "auth0|abc123", email: "sam@example.com", name: "Sam" });
  });
});

describe("getCurrentUser", () => {
  it("returns null when the visitor is signed out", async () => {
    // Arrange
    const signedOut = async () => null;

    // Act
    const user = await getCurrentUser(signedOut);

    // Assert
    expect(user).toBeNull();
  });
});
