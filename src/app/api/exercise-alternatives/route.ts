import { handlePostExerciseAlternatives } from "@/features/sessions/handle-exercise-alternatives";

export async function POST(request: Request): Promise<Response> {
  return handlePostExerciseAlternatives(request);
}
