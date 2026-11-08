export type ConnectionStatus = "active" | "removed";

/** Read port: the status of one user's connection to one client, if it exists. */
export type ConnectionLookup = {
  findConnection(userId: string, clientId: string): Promise<ExistingConnection>;
};

export type ConnectionCheckResult = { ok: true } | { ok: false; reason: "missing" | "removed" };

export type ExistingConnection = { status: ConnectionStatus; removedAt?: Date | null } | undefined;

/**
 * Consent happens at Auth0, and a token is issued only after it. So a valid token is the approval
 * record: a first token creates the connection, and a token issued after a disconnect is a
 * reconnect. A token issued before the disconnect is not enough to bring the connection back.
 */
export function needsApproval(existing: ExistingConnection, issuedAt: Date): boolean {
  if (existing === undefined) {
    return true;
  }
  if (existing.status === "active") {
    return false;
  }
  const removedAt = existing.removedAt ?? null;
  return removedAt !== null && issuedAt.getTime() > removedAt.getTime();
}

/**
 * Every MCP request must belong to an active connection (spec FR-008, SC-004). A connection
 * owned by another user is never found under this user's id, so it is refused as `missing`.
 */
export async function checkConnection(
  lookup: ConnectionLookup,
  subject: { userId: string; clientId: string },
): Promise<ConnectionCheckResult> {
  const connection = await lookup.findConnection(subject.userId, subject.clientId);
  if (!connection) {
    return { ok: false, reason: "missing" };
  }
  if (connection.status === "removed") {
    return { ok: false, reason: "removed" };
  }
  return { ok: true };
}
