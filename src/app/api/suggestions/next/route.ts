import { handleNextSuggestions } from "@/features/suggestions/handle-suggestions-next";

export async function POST(request: Request): Promise<Response> {
  return handleNextSuggestions(request);
}
