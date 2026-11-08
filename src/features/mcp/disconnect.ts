import { writeAuditEntry, type AuditSink } from "@/features/mcp/audit-log";
import type { ConnectionKey, ConnectionRepository } from "@/features/mcp/connection-repository";

export type DisconnectResult = { outcome: "removed" } | { outcome: "not_found" };

/**
 * Disconnects one of the signed-in user's connections (spec FR-008). Only the user's own
 * connections can be reached, so another user's connection reports not found and changes nothing.
 * Disconnecting twice is a no-op with the same success outcome and no second audit entry.
 */
export async function disconnectConnection(
  connections: ConnectionRepository,
  audit: AuditSink,
  key: ConnectionKey,
): Promise<DisconnectResult> {
  const current = await connections.findConnection(key.userId, key.clientId);
  if (current === undefined) {
    return { outcome: "not_found" };
  }
  if (current.status === "removed") {
    return { outcome: "removed" };
  }
  await connections.markRemoved(key);
  await writeAuditEntry(
    audit,
    { event: "disconnected", userId: key.userId, clientId: key.clientId },
    key.now,
  );
  return { outcome: "removed" };
}
