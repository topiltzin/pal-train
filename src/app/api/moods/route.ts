import { connection } from "next/server";
import { handleListMoods } from "@/features/moods/handle-moods";

export async function GET(): Promise<Response> {
  await connection();
  return handleListMoods();
}
