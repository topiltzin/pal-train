import { createHmac } from "node:crypto";

const DISTINCT_ID_LENGTH = 40;

/**
 * Opaque, stable identifier for one account. A keyed hash, so it cannot be reversed to the
 * account subject without the secret, and it stays within Umami's 50-character limit.
 * Server only: never import this from a client component.
 */
export function hashDistinctId(secret: string, subject: string): string {
  return createHmac("sha256", secret).update(subject).digest("hex").slice(0, DISTINCT_ID_LENGTH);
}
