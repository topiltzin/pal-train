"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/features/auth/session";
import { createDrizzleAuditSink } from "@/features/mcp/audit-repository";
import { createDrizzleConnectionRepository } from "@/features/mcp/connection-repository";
import { disconnectConnection } from "@/features/mcp/disconnect";

const CLIENT_ID_MAX_LENGTH = 255;

/** Disconnects one of the signed-in user's connected apps (spec US3, FR-008). */
export async function disconnectAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const clientId = String(formData.get("clientId") ?? "");
  if (clientId === "" || clientId.length > CLIENT_ID_MAX_LENGTH) {
    return;
  }
  await disconnectConnection(createDrizzleConnectionRepository(), createDrizzleAuditSink(), {
    userId: user.sub,
    clientId,
    now: new Date(),
  });
  revalidatePath("/connections");
}
