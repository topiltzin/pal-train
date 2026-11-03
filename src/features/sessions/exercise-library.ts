import { rawExerciseFiles } from "@/features/sessions/exercise-content-index";
import { exercisesSchema, type Exercise } from "@/features/sessions/exercise.schema";

export class ExerciseLibraryUnavailableError extends Error {
  constructor(cause: unknown) {
    super("The exercise library could not be loaded.", { cause });
    this.name = "ExerciseLibraryUnavailableError";
  }
}

export type ExerciseLibrary = {
  list(): Exercise[];
  byId(id: string): Exercise | undefined;
};

export function createExerciseLibrary(exercises: readonly Exercise[]): ExerciseLibrary {
  const byIdIndex = new Map(exercises.map((exercise) => [exercise.id, exercise]));
  return {
    list: () => [...exercises],
    byId: (id) => byIdIndex.get(id),
  };
}

export function parseExercises(rawFiles: readonly unknown[]): Exercise[] {
  return rawFiles.flatMap((file) => exercisesSchema.parse(file));
}

let cachedLibrary: ExerciseLibrary | undefined;

/** Parses the bundled exercise files once. Throws ExerciseLibraryUnavailableError if they are invalid. */
export function loadExerciseLibrary(): ExerciseLibrary {
  if (cachedLibrary) {
    return cachedLibrary;
  }
  try {
    cachedLibrary = createExerciseLibrary(parseExercises(rawExerciseFiles));
    return cachedLibrary;
  } catch (error) {
    throw new ExerciseLibraryUnavailableError(error);
  }
}
