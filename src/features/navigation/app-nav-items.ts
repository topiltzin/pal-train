import { focusAreas, type FocusArea, type FocusId } from "@/features/library/focus-areas";

export type AppNavLink = { label: string; href: string };

export type AppNavCard = {
  label: string;
  description: string;
  links: AppNavLink[];
};

export const LOG_OUT_HREF = "/auth/logout";

/** Muscle groups offered as quick links in the header menu. */
const LIBRARY_SHORTCUT_IDS: readonly FocusId[] = ["chest", "back", "legs", "core"];

function libraryShortcuts(areas: readonly FocusArea[]): AppNavLink[] {
  return LIBRARY_SHORTCUT_IDS.flatMap((id) => {
    const area = areas.find((candidate) => candidate.id === id);
    return area ? [{ label: area.label, href: `/library/${area.id}` }] : [];
  });
}

/** The cards shown when the header menu opens, in display order. */
export function appNavCards(
  displayName: string,
  areas: readonly FocusArea[] = focusAreas,
): AppNavCard[] {
  return [
    {
      label: "Plan a session",
      description: "Pick a mood, a muscle group, and how long you have.",
      links: [{ label: "Open planner", href: "/" }],
    },
    {
      label: "Library",
      description: "Ideas for each muscle group.",
      links: libraryShortcuts(areas),
    },
    {
      label: `Hi, ${displayName}!`,
      description: "You are signed in to Pal Buddy.",
      links: [
        { label: "Connected apps", href: "/connections" },
        { label: "Log out", href: LOG_OUT_HREF },
      ],
    },
  ];
}
