import { focusAreas } from "@/features/library/focus-areas";
import { loadLibrary } from "@/features/library/library-repository";
import { moodIds } from "@/features/moods/moods";
import { loadExerciseLibrary } from "@/features/sessions/exercise-library";

const MIN_TEMPLATES_TOTAL = 100;
const MIN_TEMPLATES_PER_FOCUS = 8;
const MIN_EXERCISES_PER_FOCUS = 10;

function templateProblems(): string[] {
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

const NEW_FOCUS_IDS = ["upper-body", "shoulders", "core"];
const MIN_ROUTINES_PER_LEVEL = 2;
const INTENSITY_LEVELS = ["low", "moderate", "high"] as const;

// Applies to the three areas added by feature 004 (spec FR-002). Stretching is mobility work and has no
// high-intensity routines by design, so it is not held to the per-level minimum.
function levelProblems(): string[] {
  const library = loadLibrary();
  const problems: string[] = [];
  for (const focus of focusAreas.filter((area) => NEW_FOCUS_IDS.includes(area.id))) {
    const templates = library.byFocus(focus.id);
    for (const level of INTENSITY_LEVELS) {
      const count = templates.filter((template) => template.intensity === level).length;
      if (count < MIN_ROUTINES_PER_LEVEL) {
        problems.push(
          `Focus "${focus.id}" has ${count} ${level} routines; at least ${MIN_ROUTINES_PER_LEVEL} required.`,
        );
      }
    }
  }
  return problems;
}

function exerciseProblems(): string[] {
  const exercises = loadExerciseLibrary().list();
  const problems: string[] = [];

  for (const focus of focusAreas) {
    const count = exercises.filter((exercise) => exercise.focus === focus.id).length;
    if (count < MIN_EXERCISES_PER_FOCUS) {
      problems.push(
        `Focus "${focus.id}" has ${count} exercises; at least ${MIN_EXERCISES_PER_FOCUS} required.`,
      );
    }
  }
  for (const moodId of moodIds) {
    if (!exercises.some((exercise) => exercise.moods.includes(moodId))) {
      problems.push(`Mood "${moodId}" has no exercise for a session.`);
    }
  }
  return problems;
}

function printExerciseCounts(): void {
  const exercises = loadExerciseLibrary().list();
  console.log("Exercises per focus area:");
  for (const focus of focusAreas) {
    const count = exercises.filter((exercise) => exercise.focus === focus.id).length;
    console.log(`  ${focus.id}: ${count}`);
  }
}

function main(): void {
  const problems = [...templateProblems(), ...exerciseProblems(), ...levelProblems()];
  if (problems.length > 0) {
    console.error("Content validation failed:");
    for (const problem of problems) {
      console.error(`  - ${problem}`);
    }
    process.exitCode = 1;
    return;
  }
  const total = loadLibrary().list().length;
  const exerciseTotal = loadExerciseLibrary().list().length;
  console.log(`Template content OK: ${total} templates across ${focusAreas.length} focus areas.`);
  console.log(`Exercise content OK: ${exerciseTotal} exercises.`);
  printExerciseCounts();
}

main();
