import { connection } from "next/server";
import { handleGetTemplate } from "@/features/library/handle-templates";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  await connection();
  const { id } = await params;
  return handleGetTemplate(id);
}
