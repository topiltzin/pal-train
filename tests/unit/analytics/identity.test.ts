import { describe, expect, it } from "vitest";
import { hashDistinctId } from "@/features/analytics/identity";

const SECRET = "s".repeat(32);
const SUBJECT = "auth0|abc123xyz";

describe("hashDistinctId", () => {
  it("returns the same value for the same secret and subject", () => {
    // Arrange, Act
    const first = hashDistinctId(SECRET, SUBJECT);
    const second = hashDistinctId(SECRET, SUBJECT);

    // Assert
    expect(first).toBe(second);
  });

  it("returns a different value for a different subject", () => {
    // Arrange, Act
    const first = hashDistinctId(SECRET, SUBJECT);
    const other = hashDistinctId(SECRET, "auth0|someone-else");

    // Assert
    expect(first).not.toBe(other);
  });

  it("returns a different value for a different secret", () => {
    // Arrange, Act
    const first = hashDistinctId(SECRET, SUBJECT);
    const other = hashDistinctId("t".repeat(32), SUBJECT);

    // Assert
    expect(first).not.toBe(other);
  });

  it("returns exactly 40 lowercase hex characters", () => {
    // Arrange, Act
    const value = hashDistinctId(SECRET, SUBJECT);

    // Assert
    expect(value).toMatch(/^[0-9a-f]{40}$/);
  });

  it("does not contain the subject or any part of an email address", () => {
    // Arrange, Act
    const value = hashDistinctId(SECRET, SUBJECT);

    // Assert
    expect(value).not.toContain("abc123xyz");
    expect(value).not.toContain("@");
  });
});
