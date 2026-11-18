import { and, eq, gt, like, ne } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { passwordResetRequests, verification } from "@/lib/db/schema";
import { RESET_WINDOW_MINUTES } from "@/features/auth/password-reset-limit";

const MS_PER_MINUTE = 60_000;
/** Better Auth stores each reset token under an identifier with this prefix. */
const RESET_TOKEN_PREFIX = "reset-password:";

/** When the account's accepted requests fall inside the rolling window ending at `now`. */
export async function countRecentRequests(userId: string, now: Date): Promise<Date[]> {
  const windowStart = new Date(now.getTime() - RESET_WINDOW_MINUTES * MS_PER_MINUTE);
  const rows = await getDb()
    .select({ requestedAt: passwordResetRequests.requestedAt })
    .from(passwordResetRequests)
    .where(
      and(
        eq(passwordResetRequests.userId, userId),
        gt(passwordResetRequests.requestedAt, windowStart),
      ),
    );
  return rows.map((row) => row.requestedAt);
}

/** Records one accepted request. Refused requests are never recorded. */
export async function recordRequest(userId: string, requestedAt: Date): Promise<void> {
  await getDb().insert(passwordResetRequests).values({ userId, requestedAt });
}

/**
 * Removes the account's reset tokens, so only the newest link works (spec FR-006). `keepToken`, when
 * given, is the newest link and is kept. Other verification rows, such as email verification, stay.
 */
export async function deleteResetTokens(userId: string, keepToken?: string): Promise<void> {
  const conditions = [
    like(verification.identifier, `${RESET_TOKEN_PREFIX}%`),
    eq(verification.value, userId),
  ];
  if (keepToken !== undefined) {
    conditions.push(ne(verification.identifier, `${RESET_TOKEN_PREFIX}${keepToken}`));
  }
  await getDb()
    .delete(verification)
    .where(and(...conditions));
}

/** Removes one reset token, used when a request is refused after Better Auth has created it. */
export async function deleteResetToken(token: string): Promise<void> {
  await getDb()
    .delete(verification)
    .where(eq(verification.identifier, `${RESET_TOKEN_PREFIX}${token}`));
}
