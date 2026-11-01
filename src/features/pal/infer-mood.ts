import { moodIds, type MoodId } from "@/features/moods/moods";

/** Words that flip the meaning of a keyword that follows them ("not tired"). */
const NEGATORS = new Set(["not", "no", "never", "dont", "isnt", "wasnt", "cant", "without"]);
const NEGATION_WINDOW_WORDS = 2;

const KEYWORDS: Record<MoodId, readonly string[]> = {
  energized: [
    "energized",
    "energy",
    "pumped",
    "hyped",
    "fired up",
    "ready",
    "awesome",
    "amazing",
    "great",
  ],
  tired: ["tired", "exhausted", "sleepy", "drained", "wiped", "worn out", "fatigued", "yawn"],
  stressed: [
    "stressed",
    "stress",
    "anxious",
    "anxiety",
    "overwhelmed",
    "frustrated",
    "pressure",
    "angry",
    "mad",
  ],
  focused: ["focused", "focus", "locked in", "concentrate", "dialed in", "sharp"],
  playful: ["playful", "fun", "silly", "goofy", "happy", "bored", "joke"],
  unmotivated: ["unmotivated", "lazy", "meh", "blah", "bleh", "couch", "no motivation"],
  "want-to-sweat": [
    "sweat",
    "sweaty",
    "intense",
    "burn",
    "beast mode",
    "brutal",
    "crush",
    "push",
    "hard",
  ],
  calm: ["calm", "chill", "relaxed", "relax", "peaceful", "mellow", "zen", "gentle", "easy"],
};

function normalize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function countUnnegatedHits(words: readonly string[], keyword: string): number {
  const keywordWords = keyword.split(" ");
  let hits = 0;
  for (let start = 0; start + keywordWords.length <= words.length; start += 1) {
    const matches = keywordWords.every((word, offset) => words[start + offset] === word);
    if (!matches) {
      continue;
    }
    const before = words.slice(Math.max(0, start - NEGATION_WINDOW_WORDS), start);
    const negated = before.some((word) => NEGATORS.has(word));
    if (!negated) {
      hits += 1;
    }
  }
  return hits;
}

function scoreMood(words: readonly string[], mood: MoodId): number {
  return KEYWORDS[mood].reduce((total, keyword) => total + countUnnegatedHits(words, keyword), 0);
}

/**
 * Reads a free-text check-in ("so tired after work") and returns the best matching mood.
 * Returns null when nothing matches, so the caller can ask the user to pick one.
 */
export function inferMoodFromText(text: string): MoodId | null {
  const words = normalize(text);
  let best: { mood: MoodId; score: number } | null = null;
  for (const mood of moodIds) {
    const score = scoreMood(words, mood);
    if (score > 0 && (best === null || score > best.score)) {
      best = { mood, score };
    }
  }
  return best?.mood ?? null;
}
