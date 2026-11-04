import type { NewDemoLink } from "@/features/demos/demo-link";
import { validateNewDemoLink } from "@/features/demos/demo-link";
import type { DemoLinkRepository } from "@/features/demos/demo-link-repository";

const REVIEW_COLUMNS = ["exercise_id", "video_id", "source_title", "decision", "note"] as const;
const ACCEPT = "accept";
const REJECT = "reject";

export type ReviewedImport = {
  links: NewDemoLink[];
  problems: string[];
};

export type ImportSummary = {
  imported: number;
  unchanged: number;
  problems: string[];
};

/** Splits CSV text into rows of cells. Handles quoted cells, commas inside quotes, and "" escapes. */
function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char !== '"') {
        cell += char;
      } else if (text[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else {
        quoted = false;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (char !== "\r") {
      cell += char;
    }
  }
  if (cell !== "" || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((cells) => cells.some((value) => value.trim() !== ""));
}

function checkHeader(header: string[] | undefined): void {
  if (!header || header.join(",") !== REVIEW_COLUMNS.join(",")) {
    throw new Error(`The reviewed file header must be: ${REVIEW_COLUMNS.join(",")}`);
  }
}

/** Keeps the accepted rows that are valid, and reports every problem with its row number. */
export function parseReviewedCsv(text: string): ReviewedImport {
  const [header, ...body] = parseCsvRows(text);
  checkHeader(header);
  const problems: string[] = [];
  const candidates: NewDemoLink[] = [];

  body.forEach((cells, index) => {
    const rowNumber = index + 2;
    const [exerciseId, videoId, sourceTitle, decision] = cells.map((value) => value.trim());
    const verdict = decision.toLowerCase();
    if (verdict === REJECT) return;
    if (verdict !== ACCEPT) {
      problems.push(`Row ${rowNumber}: decision must be ${ACCEPT} or ${REJECT}.`);
      return;
    }
    const result = validateNewDemoLink({ exerciseId, videoId, sourceTitle });
    if (!result.ok) {
      problems.push(`Row ${rowNumber} (${exerciseId}): ${result.reason} is not valid.`);
      return;
    }
    candidates.push(result.value);
  });

  return withoutDuplicateExercises(candidates, problems);
}

/** An exercise with two accepted Shorts is ambiguous, so neither is stored until the review fixes it. */
function withoutDuplicateExercises(candidates: NewDemoLink[], problems: string[]): ReviewedImport {
  const counts = new Map<string, number>();
  for (const candidate of candidates) {
    counts.set(candidate.exerciseId, (counts.get(candidate.exerciseId) ?? 0) + 1);
  }
  const duplicated = new Set([...counts].filter(([, count]) => count > 1).map(([id]) => id));
  for (const exerciseId of duplicated) {
    problems.push(`Exercise ${exerciseId} has more than one accepted Short; none were imported.`);
  }
  return {
    links: candidates.filter((candidate) => !duplicated.has(candidate.exerciseId)),
    problems,
  };
}

/**
 * Stores each accepted link through the repository. A link that is already the exercise's active
 * link is counted as unchanged, so running the same file again adds nothing.
 */
export async function importReviewed(
  text: string,
  repository: DemoLinkRepository,
): Promise<ImportSummary> {
  const { links, problems } = parseReviewedCsv(text);
  const active = await repository.listActiveByExerciseIds(links.map((link) => link.exerciseId));
  const activeByExercise = new Map(active.map((link) => [link.exerciseId, link] as const));

  let imported = 0;
  let unchanged = 0;
  for (const link of links) {
    const current = activeByExercise.get(link.exerciseId);
    if (current && current.videoId === link.videoId && current.sourceTitle === link.sourceTitle) {
      unchanged += 1;
      continue;
    }
    await repository.upsertActive(link);
    imported += 1;
  }
  return { imported, unchanged, problems };
}
