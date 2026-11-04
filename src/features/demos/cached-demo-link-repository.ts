import type { DemoLink, NewDemoLink } from "@/features/demos/demo-link";
import type { DemoLinkRepository } from "@/features/demos/demo-link-repository";

/**
 * Each plan request looks up the demo for every exercise in it. A database round trip on every
 * slider release made the plan feel frozen, and demos change rarely, so the active links are kept
 * in memory for a short time. A change made here is seen at once; a change made by the import
 * script is seen within the time-to-live.
 */
export const ACTIVE_LINK_TTL_MS = 60_000;

type CacheEntry = { links: DemoLink[]; expiresAt: number };

export function withLinkCache(
  inner: DemoLinkRepository,
  ttlMs: number = ACTIVE_LINK_TTL_MS,
  now: () => number = Date.now,
): DemoLinkRepository {
  const entries = new Map<string, CacheEntry>();

  function isFresh(exerciseId: string, at: number): boolean {
    const entry = entries.get(exerciseId);
    return entry !== undefined && entry.expiresAt > at;
  }

  return {
    async listActiveByExerciseIds(exerciseIds) {
      const at = now();
      const unseen = [...new Set(exerciseIds)].filter((id) => !isFresh(id, at));
      if (unseen.length > 0) {
        const fetched = await inner.listActiveByExerciseIds(unseen);
        for (const exerciseId of unseen) {
          entries.set(exerciseId, {
            links: fetched.filter((link) => link.exerciseId === exerciseId),
            expiresAt: at + ttlMs,
          });
        }
      }
      return exerciseIds.flatMap((exerciseId) => entries.get(exerciseId)?.links ?? []);
    },

    async upsertActive(link: NewDemoLink) {
      entries.delete(link.exerciseId);
      return inner.upsertActive(link);
    },

    async deactivate(exerciseId: string) {
      entries.delete(exerciseId);
      return inner.deactivate(exerciseId);
    },
  };
}
