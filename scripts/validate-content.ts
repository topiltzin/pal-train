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
  const problems = [...templateProblems(), ...exerciseProblems()];
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
