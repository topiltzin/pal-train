/**
 * YouTube video ids are 11 characters from the URL-safe alphabet. Only a validated id ever
 * reaches an embed URL, so a stored value cannot point the player at another host (FR-007).
 */
export const VIDEO_ID_LENGTH = 11;

const VIDEO_ID_PATTERN = new RegExp(`^[A-Za-z0-9_-]{${VIDEO_ID_LENGTH}}$`);
export const EMBED_ORIGIN = "https://www.youtube-nocookie.com";
const WATCH_ORIGIN = "https://www.youtube.com";
// enablejsapi lets the page hear the player's ready and error messages (see player-event.ts).
const EMBED_QUERY = "autoplay=1&playsinline=1&rel=0&modestbranding=1&enablejsapi=1";

export function isValidVideoId(videoId: string): boolean {
  return VIDEO_ID_PATTERN.test(videoId);
}

/** The privacy-enhanced player address. Only call it with an id that passed isValidVideoId. */
export function buildEmbedUrl(videoId: string): string {
  return `${EMBED_ORIGIN}/embed/${videoId}?${EMBED_QUERY}`;
}

/** The Short's own page, used only for the "Open on YouTube" fallback link. */
export function shortsPageUrl(videoId: string): string {
  return `${WATCH_ORIGIN}/shorts/${videoId}`;
}
