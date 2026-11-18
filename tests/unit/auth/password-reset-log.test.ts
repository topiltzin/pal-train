import { afterEach, describe, expect, it, vi } from "vitest";
import { logResetEvent } from "@/features/auth/password-reset-log";

const USER_ID = "user-reset-1";
const EMAIL = "reader@example.test";
const HASH_LENGTH = 16;

afterEach(() => {
  vi.restoreAllMocks();
});

function capturedLine(spy: { mock: { calls: unknown[][] } }): string {
  return spy.mock.calls.map((call) => call.map(String).join(" ")).join("\n");
}

function hashesIn(output: string): string[] {
  return [...output.matchAll(/"emailHash":"([0-9a-f]+)"/g)].map((match) => match[1]);
}

describe("logResetEvent", () => {
  it("logs the event with the account id and a truncated hash of the email", () => {
    // Arrange
    const spy = vi.spyOn(console, "info").mockImplementation(() => {});

    // Act
    logResetEvent("password reset requested", { userId: USER_ID, email: EMAIL });

    // Assert
    const line = capturedLine(spy);
    expect(line).toContain("password reset requested");
    expect(line).toContain(USER_ID);
    expect(hashesIn(line)[0]).toHaveLength(HASH_LENGTH);
  });

  it("never logs the email address itself", () => {
    // Arrange
    const spy = vi.spyOn(console, "info").mockImplementation(() => {});

    // Act
    logResetEvent("password reset completed", { userId: USER_ID, email: EMAIL });

    // Assert
    expect(capturedLine(spy)).not.toContain(EMAIL);
  });

  it("gives the same hash for the same address, so repeated requests can be matched", () => {
    // Arrange
    const spy = vi.spyOn(console, "info").mockImplementation(() => {});

    // Act
    logResetEvent("password reset requested", { userId: USER_ID, email: EMAIL });
    logResetEvent("password reset refused", { userId: USER_ID, email: EMAIL });

    // Assert
    const hashes = hashesIn(capturedLine(spy));
    expect(hashes).toHaveLength(2);
    expect(hashes[0]).toBe(hashes[1]);
  });

  it("hashes the address without regard to letter case, so the same mailbox always matches", () => {
    // Arrange
    const spy = vi.spyOn(console, "info").mockImplementation(() => {});

    // Act
    logResetEvent("password reset requested", { userId: USER_ID, email: "Reader@Example.TEST" });
    logResetEvent("password reset requested", { userId: USER_ID, email: EMAIL });

    // Assert
    const hashes = hashesIn(capturedLine(spy));
    expect(hashes[0]).toBe(hashes[1]);
  });
});
