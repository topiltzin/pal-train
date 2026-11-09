import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { mcpConnections, users } from "@/lib/db/schema";
import { createDrizzleConnectionRepository } from "@/features/mcp/connection-repository";
import { checkConnection } from "@/features/mcp/connection-check";
import { disconnectConnection } from "@/features/mcp/disconnect";
import { createDrizzleAuditSink } from "@/features/mcp/audit-repository";

const TEST_USER = "test-mcp-disc-user";
const TEST_CLIENT = "test-mcp-disc-client";

beforeAll(async () => {
  await getDb()
    .insert(users)
    .values({ id: TEST_USER, email: "test-mcp-disc@example.com", displayName: "Test MCP" })
    .onConflictDoNothing();
});

afterAll(async () => {
  await getDb().delete(users).where(eq(users.id, TEST_USER));
});

describe("disconnect (database)", () => {
  it("refuses the next request after disconnect, and reconnecting reuses the same row", async () => {
    // Arrange
    const repo = createDrizzleConnectionRepository();
    const audit = createDrizzleAuditSink();
    const key = { userId: TEST_USER, clientId: TEST_CLIENT };
    await repo.approve({
      ...key,
      clientName: "OpenAI",
      grantedScopes: "plans:read",
      now: new Date(),
    });

    // Act
    const consents = { revokeForClient: async () => {} };
    const result = await disconnectConnection(repo, audit, consents, { ...key, now: new Date() });
    const afterDisconnect = await checkConnection(repo, key);
    await repo.approve({
      ...key,
      clientName: "OpenAI",
      grantedScopes: "plans:read",
      now: new Date(),
    });
    const afterReconnect = await checkConnection(repo, key);

    // Assert
    expect(result).toEqual({ outcome: "removed" });
    expect(afterDisconnect).toEqual({ ok: false, reason: "removed" });
    expect(afterReconnect).toEqual({ ok: true });
    const rows = await getDb()
      .select()
      .from(mcpConnections)
      .where(eq(mcpConnections.userId, TEST_USER));
    expect(rows).toHaveLength(1);
  });
});
