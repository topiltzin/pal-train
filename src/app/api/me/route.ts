import { connection } from "next/server";
import { handleGetMe } from "@/features/auth/me";

export async function GET(): Promise<Response> {
  await connection();
  return handleGetMe();
}
