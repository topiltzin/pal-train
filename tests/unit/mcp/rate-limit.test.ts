import { describe, expect, it } from "vitest";
import {
  MCP_REQUESTS_PER_MINUTE,
  checkRateLimit,
  windowStartFor,
  type RateCounter,
} from "@/features/mcp/rate-limit";

/** An in-memory counter with the same contract as the database implementation. */
function memoryCounter(): RateCounter {
  const counts = new Map<string, number>();
  return {
    async increment(userId, windowStart) {
      const key = `${userId}|${windowStart.toISOString()}`;
      const next = (counts.get(key) ?? 0) + 1;
      counts.set(key, next);
      return next;
    },
  };
}

describe("windowStartFor", () => {
  it("truncates a time to the start of its minute", () => {
    // Arrange
    const now = new Date("2026-11-07T10:15:42.987Z");

    // Act
    const start = windowStartFor(now);

    // Assert
    expect(start.toISOString()).toBe("2026-11-07T10:15:00.000Z");
  });
});

describe("checkRateLimit", () => {
  it("accepts the sixtieth request in a minute", async () => {
    // Arrange
    const counter = memoryCounter();
    const now = new Date("2026-11-07T10:15:10Z");
    for (let i = 0; i < MCP_REQUESTS_PER_MINUTE - 1; i += 1) {
      await checkRateLimit(counter, "user-1", now);
    }

    // Act
    const result = await checkRateLimit(counter, "user-1", now);

    // Assert
    expect(result.allowed).toBe(true);
  });

  it("refuses the sixty-first request with a retry time within the minute", async () => {
    // Arrange
    const counter = memoryCounter();
    const now = new Date("2026-11-07T10:15:10Z");
    for (let i = 0; i < MCP_REQUESTS_PER_MINUTE; i += 1) {
      await checkRateLimit(counter, "user-1", now);
    }

    // Act
    const result = await checkRateLimit(counter, "user-1", now);

    // Assert
    expect(result.allowed).toBe(false);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
    expect(result.retryAfterSeconds).toBeLessThanOrEqual(60);
  });

  it("resets the count in the next minute", async () => {
    // Arrange
    const counter = memoryCounter();
    const first = new Date("2026-11-07T10:15:10Z");
    const next = new Date("2026-11-07T10:16:01Z");
    for (let i = 0; i < MCP_REQUESTS_PER_MINUTE + 1; i += 1) {
      await checkRateLimit(counter, "user-1", first);
    }

    // Act
    const result = await checkRateLimit(counter, "user-1", next);

    // Assert
    expect(result.allowed).toBe(true);
  });

  it("keeps each user's count separate", async () => {
    // Arrange
    const counter = memoryCounter();
    const now = new Date("2026-11-07T10:15:10Z");
    for (let i = 0; i < MCP_REQUESTS_PER_MINUTE; i += 1) {
      await checkRateLimit(counter, "user-1", now);
    }

    // Act
    const result = await checkRateLimit(counter, "user-2", now);

    // Assert
    expect(result.allowed).toBe(true);
  });

  it("sets the per-minute limit to a named constant of 60", () => {
    // Arrange, Act, Assert
    expect(MCP_REQUESTS_PER_MINUTE).toBe(60);
  });
});
