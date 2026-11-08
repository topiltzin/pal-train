/** Events the connector records (spec FR-015). */
export const AUDIT_EVENTS = [
  "consent_granted",
  "consent_denied",
  "token_accepted",
  "token_refused",
  "connection_refused",
  "disconnected",
  "rate_limited",
] as const;

export type AuditEvent = (typeof AUDIT_EVENTS)[number];

/** Data model rule: a reason code is a short code, at most 64 characters. */
export const REASON_CODE_MAX_LENGTH = 64;

export type AuditInput = {
  event: AuditEvent;
  userId?: string;
  clientId?: string;
  reasonCode?: string;
};

/** Exactly the stored fields. Nothing else can reach the table. */
export type AuditRecord = {
  createdAt: Date;
  event: AuditEvent;
  userId: string | null;
  clientId: string | null;
  reasonCode: string | null;
};

/** Storage port for audit entries. */
export type AuditSink = {
  append(record: AuditRecord): Promise<void>;
};

function assertKnownEvent(event: string): asserts event is AuditEvent {
  if (!(AUDIT_EVENTS as readonly string[]).includes(event)) {
    throw new Error(`Unknown audit event: ${event}`);
  }
}

function assertReasonCode(reasonCode: string | null | undefined): void {
  if (typeof reasonCode === "string" && reasonCode.length > REASON_CODE_MAX_LENGTH) {
    throw new Error(`Audit reason code exceeds ${REASON_CODE_MAX_LENGTH} characters`);
  }
}

/**
 * Builds the record from the allowed fields only and appends it. Any other field passed in is
 * dropped, so personal data or tokens cannot be stored by accident (data model rule).
 */
export async function writeAuditEntry(
  sink: AuditSink,
  input: AuditInput,
  now: Date,
): Promise<void> {
  assertKnownEvent(input.event);
  assertReasonCode(input.reasonCode);
  await sink.append({
    createdAt: now,
    event: input.event,
    userId: input.userId ?? null,
    clientId: input.clientId ?? null,
    reasonCode: input.reasonCode ?? null,
  });
}
