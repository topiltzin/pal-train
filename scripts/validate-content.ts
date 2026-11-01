import { focusAreas } from "@/features/library/focus-areas";
import { loadLibrary } from "@/features/library/library-repository";
import { moodIds } from "@/features/moods/moods";

const MIN_TEMPLATES_TOTAL = 100;
const MIN_TEMPLATES_PER_FOCUS = 8;

function collectProblems(): string[] {
  const library = loadLibrary();
  const templates = library.list();
  const problems: string[] = [];

  if (templates.length < MIN_TEMPLATES_TOTAL) {
    problems.push(`Only ${templates.length} templates; at least ${MIN_TEMPLATES_TOTAL} required.`);
  }
  for (const focus of focusAreas) {
    const count = library.byFocus(focus.id).length;
    if (count < MIN_TEMPLATES_PER_FOCUS) {
      problems.push(
        `Focus "${focus.id}" has ${count} templates; at least ${MIN_TEMPLATES_PER_FOCUS} required.`,
      );
    }
  }
  for (const moodId of moodIds) {
    if (!templates.some((template) => template.moods.includes(moodId))) {
      problems.push(`Mood "${moodId}" has no template to suggest.`);
    }
  }
  return problems;
}

function main(): void {
  const problems = collectProblems();
  if (problems.length > 0) {
    console.error("Template content validation failed:");
    for (const problem of problems) {
      console.error(`  - ${problem}`);
    }
    process.exitCode = 1;
    return;
  }
  const total = loadLibrary().list().length;
  console.log(`Template content OK: ${total} templates across ${focusAreas.length} focus areas.`);
}

main();
