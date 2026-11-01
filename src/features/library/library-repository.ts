import type { FocusId } from "@/features/library/focus-areas";
import { templateSchema, type Template } from "@/features/library/template.schema";
import { rawTemplateFiles } from "@/features/library/content-index";

export class LibraryUnavailableError extends Error {
  constructor(cause: unknown) {
    super("The workout library could not be loaded.", { cause });
    this.name = "LibraryUnavailableError";
  }
}

export type LibraryRepository = {
  list(): Template[];
  byId(id: string): Template | undefined;
  byFocus(focus: FocusId): Template[];
};

export function createLibraryRepository(templates: readonly Template[]): LibraryRepository {
  const byIdIndex = new Map(templates.map((template) => [template.id, template]));
  return {
    list: () => [...templates],
    byId: (id) => byIdIndex.get(id),
    byFocus: (focus) => templates.filter((template) => template.focus === focus),
  };
}

export function parseTemplates(rawFiles: readonly unknown[]): Template[] {
  return rawFiles.flatMap((file) => templateSchema.array().parse(file));
}

let cachedLibrary: LibraryRepository | undefined;

export function loadLibrary(): LibraryRepository {
  if (cachedLibrary) {
    return cachedLibrary;
  }
  try {
    cachedLibrary = createLibraryRepository(parseTemplates(rawTemplateFiles));
    return cachedLibrary;
  } catch (error) {
    throw new LibraryUnavailableError(error);
  }
}
