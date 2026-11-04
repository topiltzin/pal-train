import { isValidVideoId } from "@/features/demos/video-id";

export const MIN_SOURCE_TITLE_LENGTH = 1;
export const MAX_SOURCE_TITLE_LENGTH = 200;

/** A stored link, as the database holds it. Only toDemoView leaves the server. */
export type DemoLink = {
  id: number;
  exerciseId: string;
  videoId: string;
  sourceTitle: string;
  channel: string;
  active: boolean;
  addedAt: Date;
};

/** What the exercise page receives: enough to play the Short and label it, nothing internal. */
export type DemoView = {
  videoId: string;
  title: string;
};

export type NewDemoLink = {
  exerciseId: string;
  videoId: string;
  sourceTitle: string;
};

export type DemoLinkProblem = "exercise-id" | "video-id" | "source-title";

export type DemoLinkValidation =
  { ok: true; value: NewDemoLink } | { ok: false; reason: DemoLinkProblem };

export function toDemoView(link: DemoLink): DemoView {
  return { videoId: link.videoId, title: link.sourceTitle };
}

/** Checks a link before it is stored. Nothing invalid reaches the database (FR-005, FR-007). */
export function validateNewDemoLink(input: NewDemoLink): DemoLinkValidation {
  if (input.exerciseId.trim() === "") return { ok: false, reason: "exercise-id" };
  if (!isValidVideoId(input.videoId)) return { ok: false, reason: "video-id" };
  const titleLength = input.sourceTitle.length;
  if (titleLength < MIN_SOURCE_TITLE_LENGTH || titleLength > MAX_SOURCE_TITLE_LENGTH) {
    return { ok: false, reason: "source-title" };
  }
  return { ok: true, value: input };
}
