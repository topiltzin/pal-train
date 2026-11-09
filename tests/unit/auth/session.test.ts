import { describe, expect, it } from "vitest";
import { toSessionUser } from "@/features/auth/session";

describe("toSessionUser", () => {
  it("maps a Better Auth session to the app user, keyed by the Better Auth user id", () => {
    // Arrange
    const session = {
      user: { id: "user-abc123", email: "sam@example.com", name: "Sam" },
      session: { id: "session-1" },
    };

    // Act
    const user = toSessionUser(session);

    // Assert
    expect(user).toEqual({ sub: "user-abc123", email: "sam@example.com", name: "Sam" });
  });

  it("returns null when there is no session", () => {
    // Arrange, Act
    const user = toSessionUser(null);

    // Assert
    expect(user).toBeNull();
  });

  it("returns null when the session user has no email, because the user row needs one", () => {
    // Arrange
    const session = { user: { id: "user-abc123", email: "", name: "Sam" }, session: { id: "s" } };

    // Act
    const user = toSessionUser(session);

    // Assert
    expect(user).toBeNull();
  });
});
