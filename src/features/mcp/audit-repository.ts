import { getDb } from "@/lib/db/client";
import { mcpAuditEntries } from "@/lib/db/schema";
import type { AuditSink } from "@/features/mcp/audit-log";

/** Database sink for audit entries. It receives only the record `writeAuditEntry` built. */
export function createDrizzleAuditSink(): AuditSink {
  return {
    async append(record) {
      await getDb().insert(mcpAuditEntries).values({
        createdAt: record.createdAt,
        event: record.event,
        userId: record.userId,
        clientId: record.clientId,
        reasonCode: record.reasonCode,
      });
    },
  };
}
