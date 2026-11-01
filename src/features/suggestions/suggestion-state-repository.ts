import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { suggestionState } from "@/lib/db/schema";

export async function getLastShownTemplateId(userId: string): Promise<string | null> {
  const [row] = await getDb()
    .select({ lastTemplateId: suggestionState.lastTemplateId })
    .from(suggestionState)
    .where(eq(suggestionState.userId, userId));
  return row?.lastTemplateId ?? null;
}

export async function setLastShownTemplateId(userId: string, templateId: string): Promise<void> {
  await getDb()
    .insert(suggestionState)
    .values({ userId, lastTemplateId: templateId, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: suggestionState.userId,
      set: { lastTemplateId: templateId, updatedAt: new Date() },
    });
}
