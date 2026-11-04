import type { DemoLink, NewDemoLink } from "@/features/demos/demo-link";

/**
 * Storage for demo links. Business code depends on this interface, never on the database
 * client, so tests can substitute the in-memory fake below.
 */
export type DemoLinkRepository = {
  /** Active links only, for the given exercises. An empty list of ids returns no links. */
  listActiveByExerciseIds(exerciseIds: readonly string[]): Promise<DemoLink[]>;
  /** Makes `link` the exercise's only active link; the previous active link is kept as history. */
  upsertActive(link: NewDemoLink): Promise<DemoLink>;
  /** Removes the exercise's active link from the page; the row is kept as history. */
  deactivate(exerciseId: string): Promise<void>;
};

export const DEMO_CHANNEL = "officialdemic";

export type InMemoryDemoLinkRepository = DemoLinkRepository & {
  /** Test helper: removes every link. */
  clear(): void;
};

/** Same rules as the database: at most one active link per exercise, newest wins. */
export function createInMemoryDemoLinkRepository(): InMemoryDemoLinkRepository {
  let links: DemoLink[] = [];
  let nextId = 1;

  return {
    async listActiveByExerciseIds(exerciseIds) {
      if (exerciseIds.length === 0) return [];
      const wanted = new Set(exerciseIds);
      return links
        .filter((link) => link.active && wanted.has(link.exerciseId))
        .map((link) => ({ ...link }));
    },

    async upsertActive(newLink) {
      links = links.map((link) =>
        link.exerciseId === newLink.exerciseId && link.active ? { ...link, active: false } : link,
      );
      const stored: DemoLink = {
        id: nextId,
        exerciseId: newLink.exerciseId,
        videoId: newLink.videoId,
        sourceTitle: newLink.sourceTitle,
        channel: DEMO_CHANNEL,
        active: true,
        addedAt: new Date(),
      };
      nextId += 1;
      links = [...links, stored];
      return { ...stored };
    },

    async deactivate(exerciseId) {
      links = links.map((link) =>
        link.exerciseId === exerciseId && link.active ? { ...link, active: false } : link,
      );
    },

    clear() {
      links = [];
      nextId = 1;
    },
  };
}
