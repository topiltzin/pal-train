const SKELETON_COUNT = 3;

/** Placeholder cards shaped like the real ideas, so the list does not jump when it loads. */
export function SuggestionSkeleton() {
  return (
    <div role="status" aria-label="Finding ideas" className="flex flex-col gap-4">
      {Array.from({ length: SKELETON_COUNT }, (_, index) => (
        <div
          key={index}
          className="flex flex-col gap-3 rounded-2xl border-2 border-black/10 bg-white p-4"
        >
          <div className="skeleton-shimmer h-5 w-2/3 rounded-full" />
          <div className="skeleton-shimmer h-3 w-1/3 rounded-full" />
          <div className="skeleton-shimmer h-3 w-full rounded-full" />
          <div className="skeleton-shimmer h-3 w-5/6 rounded-full" />
        </div>
      ))}
    </div>
  );
}
