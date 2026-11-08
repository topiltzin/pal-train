import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { mcpConnections, users } from "@/lib/db/schema";
import { createDrizzleConnectionRepository } from "@/features/mcp/connection-repository";

const TEST_USER = "test-mcp-repo-user";
const TEST_CLIENT = "test-mcp-client";
const TEST_EMAIL = "test-mcp-repo@example.com";
const T0 = new Date("2026-11-07T10:00:00Z");
const T1 = new Date("2026-11-07T11:00:00Z");

beforeAll(async () => {
  await getDb()
    .insert(users)
    .values({ id: TEST_USER, email: TEST_EMAIL, displayName: "Test MCP" })
    .onConflictDoNothing();
});

afterAll(async () => {
  await getDb().delete(users).where(eq(users.id, TEST_USER));
});

describe("connection repository (database)", () => {
  it("approves a connection as active and finds it", async () => {
    // Arrange
    const repo = createDrizzleConnectionRepository();

    // Act
    await repo.approve({
      userId: TEST_USER,
      clientId: TEST_CLIENT,
      clientName: "OpenAI",
      grantedScopes: "plans:read",
      now: T0,
    });

    // Assert
    expect(await repo.findConnection(TEST_USER, TEST_CLIENT)).toMatchObject({ status: "active" });
  });

  it("marks the connection removed and reports that a row changed", async () => {
    // Arrange
    const repo = createDrizzleConnectionRepository();

    // Act
    const changed = await repo.markRemoved({ userId: TEST_USER, clientId: TEST_CLIENT, now: T1 });

    // Assert
    expect(changed).toBe(true);
    expect(await repo.findConnection(TEST_USER, TEST_CLIENT)).toMatchObject({ status: "removed" });
  });

  it("reactivates the same row on re-approval, with a new approval time and no removal time", async () => {
    // Arrange
    const repo = createDrizzleConnectionRepository();

    // Act
    await repo.approve({
      userId: TEST_USER,
      clientId: TEST_CLIENT,
      clientName: "OpenAI",
      grantedScopes: "plans:read",
      now: T1,
    });

    // Assert
    const rows = await getDb()
      .select()
      .from(mcpConnections)
      .where(eq(mcpConnections.userId, TEST_USER));
    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe("active");
    expect(rows[0].approvedAt.toISOString()).toBe(T1.toISOString());
    expect(rows[0].removedAt).toBeNull();
  });

  it("records the last use time", async () => {
    // Arrange
    const repo = createDrizzleConnectionRepository();

    // Act
    await repo.touchLastUsed({ userId: TEST_USER, clientId: TEST_CLIENT, now: T1 });

    // Assert
    const [row] = await getDb()
      .select({ lastUsedAt: mcpConnections.lastUsedAt })
      .from(mcpConnections)
      .where(eq(mcpConnections.userId, TEST_USER));
    expect(row.lastUsedAt?.toISOString()).toBe(T1.toISOString());
  });

  it("reports no removal when the connection does not exist", async () => {
    // Arrange
    const repo = createDrizzleConnectionRepository();

    // Act
    const changed = await repo.markRemoved({
      userId: TEST_USER,
      clientId: "no-such-client",
      now: T1,
    });

    // Assert
    expect(changed).toBe(false);
  });
});
