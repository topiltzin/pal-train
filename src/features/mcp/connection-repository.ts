import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { mcpConnections } from "@/lib/db/schema";
import type { ConnectionLookup } from "@/features/mcp/connection-check";

export type ApproveInput = {
  userId: string;
  clientId: string;
  clientName: string;
  grantedScopes: string;
  now: Date;
};

export type ConnectionKey = { userId: string; clientId: string; now: Date };

export type ConnectionSummary = {
  clientId: string;
  clientName: string;
  status: "active" | "removed";
  approvedAt: Date;
  lastUsedAt: Date | null;
  removedAt: Date | null;
};

/** Storage port for connections. Routes and features depend on this, not on the database. */
export type ConnectionRepository = ConnectionLookup & {
  /** The user's connections, newest approval first (spec US3). */
  listForUser(userId: string): Promise<ConnectionSummary[]>;
  /** Creates the connection, or reactivates it with a new approval (data model state rules). */
  approve(input: ApproveInput): Promise<void>;
  /** Marks the connection removed. Returns false when there was no connection to remove. */
  markRemoved(input: ConnectionKey): Promise<boolean>;
  /** Records a successful request. */
  touchLastUsed(input: ConnectionKey): Promise<void>;
};

const connectionWhere = (userId: string, clientId: string) =>
  and(eq(mcpConnections.userId, userId), eq(mcpConnections.clientId, clientId));

/** Drizzle implementation of the connection port. */
export function createDrizzleConnectionRepository(): ConnectionRepository {
  return {
    async listForUser(userId) {
      const rows = await getDb()
        .select({
          clientId: mcpConnections.clientId,
          clientName: mcpConnections.clientName,
          status: mcpConnections.status,
          approvedAt: mcpConnections.approvedAt,
          lastUsedAt: mcpConnections.lastUsedAt,
          removedAt: mcpConnections.removedAt,
        })
        .from(mcpConnections)
        .where(eq(mcpConnections.userId, userId))
        .orderBy(desc(mcpConnections.approvedAt));
      return rows.map((row) => ({
        ...row,
        status: row.status === "removed" ? "removed" : "active",
      }));
    },

    async findConnection(userId, clientId) {
      const [row] = await getDb()
        .select({ status: mcpConnections.status, removedAt: mcpConnections.removedAt })
        .from(mcpConnections)
        .where(connectionWhere(userId, clientId))
        .limit(1);
      if (!row) return undefined;
      return {
        status: row.status === "removed" ? "removed" : "active",
        removedAt: row.removedAt,
      };
    },

    async approve({ userId, clientId, clientName, grantedScopes, now }) {
      await getDb()
        .insert(mcpConnections)
        .values({ userId, clientId, clientName, grantedScopes, status: "active", approvedAt: now })
        .onConflictDoUpdate({
          target: [mcpConnections.userId, mcpConnections.clientId],
          set: {
            clientName,
            grantedScopes,
            status: "active",
            approvedAt: now,
            removedAt: null,
          },
        });
    },

    async markRemoved({ userId, clientId, now }) {
      const rows = await getDb()
        .update(mcpConnections)
        .set({ status: "removed", removedAt: now })
        .where(connectionWhere(userId, clientId))
        .returning({ id: mcpConnections.id });
      return rows.length > 0;
    },

    async touchLastUsed({ userId, clientId, now }) {
      await getDb()
        .update(mcpConnections)
        .set({ lastUsedAt: now })
        .where(connectionWhere(userId, clientId));
    },
  };
}
