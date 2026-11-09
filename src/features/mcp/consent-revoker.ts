import { and, eq } from "drizzle-orm";
import type { ConsentRevoker } from "@/features/mcp/disconnect";
import { oauthConsent, oauthRefreshToken } from "@/lib/db/auth-schema";
import { getDb } from "@/lib/db/client";

/**
 * Database-backed consent revoker. It deletes the user's approval for the client, so Better Auth
 * asks for consent again, and it revokes that client's refresh tokens, so no new access token
 * can be issued from them.
 */
export function createDrizzleConsentRevoker(now: () => Date = () => new Date()): ConsentRevoker {
  return {
    async revokeForClient(userId: string, clientId: string): Promise<void> {
      const db = getDb();
      await db
        .delete(oauthConsent)
        .where(and(eq(oauthConsent.userId, userId), eq(oauthConsent.clientId, clientId)));
      await db
        .update(oauthRefreshToken)
        .set({ revoked: now() })
        .where(and(eq(oauthRefreshToken.userId, userId), eq(oauthRefreshToken.clientId, clientId)));
    },
  };
}
