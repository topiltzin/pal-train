import { connection } from "next/server";
import { handleListFocusAreas } from "@/features/library/handle-focus-areas";

export async function GET(): Promise<Response> {
  await connection();
  return handleListFocusAreas();
}
