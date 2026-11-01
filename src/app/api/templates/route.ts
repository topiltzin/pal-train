import { connection } from "next/server";
import { handleListTemplates } from "@/features/library/handle-templates";

export async function GET(request: Request): Promise<Response> {
  await connection();
  return handleListTemplates(request);
}
