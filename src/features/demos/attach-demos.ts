import { toDemoView, type DemoLink, type DemoView } from "@/features/demos/demo-link";

export type WithDemo<T> = T & { demo: DemoView | null };

/**
 * Adds each exercise's active demo, or null. Pure: the exercises are copied, never changed.
 * A link for an exercise that is not in the list is ignored.
 */
export function attachDemos<T extends { id: string }>(
  exercises: readonly T[],
  links: readonly DemoLink[],
): WithDemo<T>[] {
  const activeByExercise = new Map(
    links.filter((link) => link.active).map((link) => [link.exerciseId, link] as const),
  );
  return exercises.map((exercise) => {
    const link = activeByExercise.get(exercise.id);
    return { ...exercise, demo: link ? toDemoView(link) : null };
  });
}
