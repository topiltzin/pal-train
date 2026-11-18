import { createHash } from "node:crypto";

const HASH_LENGTH = 16;

export type ResetEvent =
  "password reset requested" | "password reset completed" | "password reset refused";

/**
 * A short, stable fingerprint of an email address for the logs. Letter case is ignored, so one
 * mailbox always gives one value. The address itself is never logged (spec FR-013).
 */
export function hashEmail(email: string): string {
  return createHash("sha256")
    .update(email.trim().toLowerCase())
    .digest("hex")
    .slice(0, HASH_LENGTH);
}

/** Writes one structured line for a reset event: the account id and the email fingerprint only. */
export function logResetEvent(
  event: ResetEvent,
  { userId, email }: { userId: string; email: string },
) {
  console.info(JSON.stringify({ event, userId, emailHash: hashEmail(email) }));
}
