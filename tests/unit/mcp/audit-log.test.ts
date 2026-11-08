import { describe, expect, it } from "vitest";
import { AUDIT_EVENTS, writeAuditEntry, type AuditSink } from "@/features/mcp/audit-log";

function recordingSink(): AuditSink & { records: unknown[] } {
  const records: unknown[] = [];
  return {
    records,
    async append(record) {
      records.push(record);
    },
  };
}

const NOW = new Date("2026-11-07T10:15:00Z");

describe("writeAuditEntry", () => {
  it.each(AUDIT_EVENTS)("accepts the %s event", async (event) => {
    // Arrange
    const sink = recordingSink();

    // Act
    await writeAuditEntry(sink, { event, userId: "user-1", clientId: "client-1" }, NOW);

    // Assert
    expect(sink.records).toHaveLength(1);
  });

  it("rejects an event kind that is not in the list", async () => {
    // Arrange
    const sink = recordingSink();

    // Act and Assert
    await expect(writeAuditEntry(sink, { event: "password_reset" as never }, NOW)).rejects.toThrow(
      /Unknown audit event/,
    );
    expect(sink.records).toHaveLength(0);
  });

  it("rejects a reason code longer than 64 characters", async () => {
    // Arrange
    const sink = recordingSink();

    // Act and Assert
    await expect(
      writeAuditEntry(sink, { event: "token_refused", reasonCode: "x".repeat(65) }, NOW),
    ).rejects.toThrow(/reason code/);
  });

  it("stores exactly the allowed fields and drops any personal data passed in", async () => {
    // Arrange
    const sink = recordingSink();
    const leaking = {
      event: "token_accepted",
      userId: "user-1",
      clientId: "client-1",
      reasonCode: null,
      email: "someone@example.com",
      displayName: "Someone",
      token: "eyJhbGciOi...",
      moodId: "calm",
    };

    // Act
    await writeAuditEntry(sink, leaking as never, NOW);

    // Assert
    expect(sink.records[0]).toEqual({
      createdAt: NOW,
      event: "token_accepted",
      userId: "user-1",
      clientId: "client-1",
      reasonCode: null,
    });
  });

  it("stores null for an unlinked refusal with no user or client", async () => {
    // Arrange
    const sink = recordingSink();

    // Act
    await writeAuditEntry(sink, { event: "token_refused", reasonCode: "expired" }, NOW);

    // Assert
    expect(sink.records[0]).toMatchObject({ userId: null, clientId: null, reasonCode: "expired" });
  });
});
