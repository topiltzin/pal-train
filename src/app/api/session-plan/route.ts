import { handlePostSessionPlan } from "@/features/sessions/handle-session-plan";

export async function POST(request: Request): Promise<Response> {
  return handlePostSessionPlan(request);
}
