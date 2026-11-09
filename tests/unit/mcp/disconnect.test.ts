import { describe, expect, it } from "vitest";
import { disconnectConnection, type ConsentRevoker } from "@/features/mcp/disconnect";
import type { ConnectionKey, ConnectionRepository } from "@/features/mcp/connection-repository";
import type { AuditSink, AuditRecord } from "@/features/mcp/audit-log";

const NOW = new Date("2026-11-07T12:00:00Z");

/** Fake repository that marks a row removed only when its owner matches. */
function repoWith(rows: { userId: string; clientId: string; status: "active" | "removed" }[]) {
  const removedKeys: ConnectionKey[] = [];
  const repo = {
    async findConnection(userId: string, clientId: string) {
      const row = rows.find((r) => r.userId === userId && r.clientId === clientId);
      return row ? { status: row.status } : undefined;
    },
    async markRemoved(key: ConnectionKey) {
      const row = rows.find((r) => r.userId === key.userId && r.clientId === key.clientId);
      if (!row) return false;
      row.status = "removed";
      removedKeys.push(key);
      return true;
    },
    async approve() {},
    async touchLastUsed() {},
    async listForUser() {
      return [];
    },
  } satisfies ConnectionRepository;
  return { repo, rows, removedKeys };
}

/** Fake consent store that records every revocation it is asked to make. */
function recordingConsents(): ConsentRevoker & { revoked: { userId: string; clientId: string }[] } {
  const revoked: { userId: string; clientId: string }[] = [];
  return {
    revoked,
    async revokeForClient(userId, clientId) {
      revoked.push({ userId, clientId });
    },
  };
}

function recordingSink(): AuditSink & { records: AuditRecord[] } {
  const records: AuditRecord[] = [];
  return {
    records,
    async append(record) {
      records.push(record);
    },
  };
}

describe("disconnectConnection", () => {
  it("marks an active connection removed and writes one disconnected entry", async () => {
    // Arrange
    const { repo, rows } = repoWith([{ userId: "user-1", clientId: "client-1", status: "active" }]);
    const sink = recordingSink();

    // Act
    const result = await disconnectConnection(repo, sink, recordingConsents(), {
      userId: "user-1",
      clientId: "client-1",
      now: NOW,
    });

    // Assert
    expect(result).toEqual({ outcome: "removed" });
    expect(rows[0].status).toBe("removed");
    expect(sink.records.map((record) => record.event)).toEqual(["disconnected"]);
  });

  it("revokes the user's consent for that client, so reconnecting asks for consent again", async () => {
    // Arrange
    const { repo } = repoWith([{ userId: "user-1", clientId: "client-1", status: "active" }]);
    const consents = recordingConsents();

    // Act
    await disconnectConnection(repo, recordingSink(), consents, {
      userId: "user-1",
      clientId: "client-1",
      now: NOW,
    });

    // Assert
    expect(consents.revoked).toEqual([{ userId: "user-1", clientId: "client-1" }]);
  });

  it("treats a second disconnect as a no-op that reports the same outcome", async () => {
    // Arrange
    const { repo } = repoWith([{ userId: "user-1", clientId: "client-1", status: "removed" }]);
    const sink = recordingSink();
    const consents = recordingConsents();

    // Act
    const result = await disconnectConnection(repo, sink, consents, {
      userId: "user-1",
      clientId: "client-1",
      now: NOW,
    });

    // Assert
    expect(result).toEqual({ outcome: "removed" });
    expect(sink.records).toHaveLength(0);
    expect(consents.revoked).toHaveLength(0);
  });

  it("reports not found and changes nothing for a connection that belongs to someone else", async () => {
    // Arrange
    const { repo, rows, removedKeys } = repoWith([
      { userId: "user-2", clientId: "client-1", status: "active" },
    ]);
    const sink = recordingSink();
    const consents = recordingConsents();

    // Act
    const result = await disconnectConnection(repo, sink, consents, {
      userId: "user-1",
      clientId: "client-1",
      now: NOW,
    });

    // Assert
    expect(result).toEqual({ outcome: "not_found" });
    expect(rows[0].status).toBe("active");
    expect(removedKeys).toHaveLength(0);
    expect(sink.records).toHaveLength(0);
    expect(consents.revoked).toHaveLength(0);
  });
});
