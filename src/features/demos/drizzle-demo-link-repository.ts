import { and, eq, inArray } from "drizzle-orm";
import type { DemoLink, NewDemoLink } from "@/features/demos/demo-link";
import { DEMO_CHANNEL, type DemoLinkRepository } from "@/features/demos/demo-link-repository";
import { getDb } from "@/lib/db/client";
import { exerciseDemoLinks } from "@/lib/db/schema";

type StoredRow = typeof exerciseDemoLinks.$inferSelect;

function toDomain(row: StoredRow): DemoLink {
  return {
    id: row.id,
    exerciseId: row.exerciseId,
    videoId: row.videoId,
    sourceTitle: row.sourceTitle,
    channel: row.channel,
    active: row.active,
    addedAt: row.addedAt,
  };
}

/**
 * The only module that talks to the database for demo links. The Neon HTTP driver has no
 * interactive transactions, so the multi-step write uses a batch, which runs as one transaction.
 */
export function createDrizzleDemoLinkRepository(): DemoLinkRepository {
  return {
    async listActiveByExerciseIds(exerciseIds) {
      if (exerciseIds.length === 0) return [];
      const rows = await getDb()
        .select()
        .from(exerciseDemoLinks)
        .where(
          and(
            inArray(exerciseDemoLinks.exerciseId, [...exerciseIds]),
            eq(exerciseDemoLinks.active, true),
          ),
        );
      return rows.map(toDomain);
    },

    async upsertActive(link: NewDemoLink) {
      const db = getDb();
      const [, inserted] = await db.batch([
        db
          .update(exerciseDemoLinks)
          .set({ active: false })
          .where(
            and(
              eq(exerciseDemoLinks.exerciseId, link.exerciseId),
              eq(exerciseDemoLinks.active, true),
            ),
          ),
        db
          .insert(exerciseDemoLinks)
          .values({
            exerciseId: link.exerciseId,
            videoId: link.videoId,
            sourceTitle: link.sourceTitle,
            channel: DEMO_CHANNEL,
            active: true,
          })
          .returning(),
      ]);
      return toDomain(inserted[0]);
    },

    async deactivate(exerciseId) {
      await getDb()
        .update(exerciseDemoLinks)
        .set({ active: false })
        .where(
          and(eq(exerciseDemoLinks.exerciseId, exerciseId), eq(exerciseDemoLinks.active, true)),
        );
    },
  };
}
