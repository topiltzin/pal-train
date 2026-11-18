import { describe, expect, it } from "vitest";
import {
  decideResetRequest,
  RESET_LIMIT_PER_HOUR,
  RESET_WINDOW_MINUTES,
} from "@/features/auth/password-reset-limit";

const NOW = new Date("2026-11-18T12:00:00Z");
const MINUTE_MS = 60_000;

function minutesAgo(minutes: number): Date {
  return new Date(NOW.getTime() - minutes * MINUTE_MS);
}

describe("decideResetRequest", () => {
  it("accepts a request when the account has no recent requests", () => {
    // Arrange, Act
    const decision = decideResetRequest([], NOW);

    // Assert
    expect(decision).toBe("accept");
  });

  it("accepts a request while fewer than the limit fall inside the window", () => {
    // Arrange
    const requests = Array.from({ length: RESET_LIMIT_PER_HOUR - 1 }, (_, index) =>
      minutesAgo(index + 1),
    );

    // Act
    const decision = decideResetRequest(requests, NOW);

    // Assert
    expect(decision).toBe("accept");
  });

  it("refuses a request once the limit of requests falls inside the window", () => {
    // Arrange
    const requests = Array.from({ length: RESET_LIMIT_PER_HOUR }, (_, index) =>
      minutesAgo(index + 1),
    );

    // Act
    const decision = decideResetRequest(requests, NOW);

    // Assert
    expect(decision).toBe("refuse");
  });

  it("does not count requests older than the window", () => {
    // Arrange: five requests, all older than the window
    const requests = Array.from({ length: RESET_LIMIT_PER_HOUR }, () =>
      minutesAgo(RESET_WINDOW_MINUTES + 1),
    );

    // Act
    const decision = decideResetRequest(requests, NOW);

    // Assert
    expect(decision).toBe("accept");
  });

  it("uses a rolling window: a request exactly at the window's edge no longer counts", () => {
    // Arrange: four recent requests and one exactly one window old
    const requests = [
      minutesAgo(1),
      minutesAgo(10),
      minutesAgo(20),
      minutesAgo(30),
      minutesAgo(RESET_WINDOW_MINUTES),
    ];

    // Act
    const decision = decideResetRequest(requests, NOW);

    // Assert
    expect(decision).toBe("accept");
  });
});
