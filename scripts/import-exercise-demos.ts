import { readFileSync } from "node:fs";
import { createDrizzleDemoLinkRepository } from "@/features/demos/drizzle-demo-link-repository";
import { importReviewed } from "@/features/demos/import-rows";

/**
 * Imports the reviewed exercise-to-Short matches. Only rows marked accept are stored, and running
 * the same file again changes nothing. Usage: npm run import:demos -- <reviewed.csv>
 */
const USAGE = "Usage: npm run import:demos -- <path to demo-links.reviewed.csv>";
const PROBLEM_EXIT_CODE = 1;

async function main(): Promise<void> {
  const csvPath = process.argv[2];
  if (!csvPath) {
    console.error(USAGE);
    process.exit(PROBLEM_EXIT_CODE);
  }
  const summary = await importReviewed(
    readFileSync(csvPath, "utf8"),
    createDrizzleDemoLinkRepository(),
  );
  console.log(
    `Imported ${summary.imported} links, ${summary.unchanged} already current, ${summary.problems.length} rows with problems.`,
  );
  for (const problem of summary.problems) console.error(problem);
  process.exit(summary.problems.length > 0 ? PROBLEM_EXIT_CODE : 0);
}

main().catch((error: unknown) => {
  console.error("The import failed.", error);
  process.exit(PROBLEM_EXIT_CODE);
});
