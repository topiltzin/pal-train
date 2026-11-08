import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { mcpRateWindows } from "@/lib/db/schema";
import type { RateCounter } from "@/features/mcp/rate-limit";

/**
 * Database counter for the per-minute limit. A single upsert increments the count atomically, so
 * requests served by different instances at the same time never lose an increment.
 */
export function createDrizzleRateCounter(): RateCounter {
  return {
    async increment(userId, windowStart) {
      const [row] = await getDb()
        .insert(mcpRateWindows)
        .values({ userId, windowStart, requestCount: 1 })
        .onConflictDoUpdate({
          target: [mcpRateWindows.userId, mcpRateWindows.windowStart],
          set: { requestCount: sql`${mcpRateWindows.requestCount} + 1` },
        })
        .returning({ requestCount: mcpRateWindows.requestCount });
      return row.requestCount;
    },
  };
}
