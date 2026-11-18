import { attachDemos, type WithDemo } from "@/features/demos/attach-demos";
import type { DemoLinkRepository } from "@/features/demos/demo-link-repository";

/**
 * Attaches each exercise's active demo. Demos are an enhancement, so a failed lookup is logged
 * under `logLabel` and the exercises still return, with every demo set to null.
 */
export async function attachActiveDemos<T extends { id: string }>(
  exercises: readonly T[],
  demoLinks: DemoLinkRepository,
  libraryIds: readonly string[],
  logLabel: string,
): Promise<WithDemo<T>[]> {
  try {
    // Every library id is looked up, not only the picked ones: plans are random, so one lookup for
    // the whole library fills the cache once instead of a little more on every request.
    const links = await demoLinks.listActiveByExerciseIds([...libraryIds]);
    return attachDemos(exercises, links);
  } catch (error) {
    console.error(`${logLabel} demo lookup failed`, error);
    return exercises.map((exercise) => ({ ...exercise, demo: null }));
  }
}
