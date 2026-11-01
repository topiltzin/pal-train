import { handlePostSuggestions } from "@/features/suggestions/handle-suggestions";

export async function POST(request: Request): Promise<Response> {
  return handlePostSuggestions(request);
}
