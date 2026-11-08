import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { mcpAuditEntries, users } from "@/lib/db/schema";
import { createDrizzleRateCounter } from "@/features/mcp/rate-counter";
import { createDrizzleAuditSink } from "@/features/mcp/audit-repository";

const TEST_USER = "test-mcp-counter-user";
const WINDOW_A = new Date("2026-11-07T10:15:00Z");
const WINDOW_B = new Date("2026-11-07T10:16:00Z");
const AUDIT_CLIENT = "test-mcp-audit-client";

beforeAll(async () => {
  await getDb()
    .insert(users)
    .values({ id: TEST_USER, email: "test-mcp-counter@example.com", displayName: "Test MCP" })
    .onConflictDoNothing();
});

afterAll(async () => {
  await getDb().delete(mcpAuditEntries).where(eq(mcpAuditEntries.clientId, AUDIT_CLIENT));
  await getDb().delete(users).where(eq(users.id, TEST_USER));
});

describe("database rate counter", () => {
  it("counts requests within one window", async () => {
    // Arrange
    const counter = createDrizzleRateCounter();

    // Act
    const first = await counter.increment(TEST_USER, WINDOW_A);
    const second = await counter.increment(TEST_USER, WINDOW_A);
    const third = await counter.increment(TEST_USER, WINDOW_A);

    // Assert
    expect([first, second, third]).toEqual([1, 2, 3]);
  });

  it("starts a fresh count in the next window", async () => {
    // Arrange
    const counter = createDrizzleRateCounter();

    // Act
    const total = await counter.increment(TEST_USER, WINDOW_B);

    // Assert
    expect(total).toBe(1);
  });
});

describe("database audit sink", () => {
  it("stores the record with exactly the allowed fields", async () => {
    // Arrange
    const sink = createDrizzleAuditSink();
    const record = {
      createdAt: WINDOW_A,
      event: "token_accepted" as const,
      userId: TEST_USER,
      clientId: AUDIT_CLIENT,
      reasonCode: null,
    };

    // Act
    await sink.append(record);

    // Assert
    const rows = await getDb()
      .select({
        event: mcpAuditEntries.event,
        userId: mcpAuditEntries.userId,
        clientId: mcpAuditEntries.clientId,
        reasonCode: mcpAuditEntries.reasonCode,
      })
      .from(mcpAuditEntries)
      .where(eq(mcpAuditEntries.clientId, AUDIT_CLIENT));
    expect(rows).toEqual([
      { event: "token_accepted", userId: TEST_USER, clientId: AUDIT_CLIENT, reasonCode: null },
    ]);
  });
});
