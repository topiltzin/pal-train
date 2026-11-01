import { getDb } from "@/lib/db/client";
import { users } from "@/lib/db/schema";

const DISPLAY_NAME_MAX_LENGTH = 40;
const FALLBACK_DISPLAY_NAME = "friend";

export type UserClaims = {
  sub: string;
  email: string;
  name?: string;
};

export type StoredUser = {
  id: string;
  email: string;
  displayName: string;
};

function emailLocalPart(email: string): string {
  return email.split("@")[0] ?? "";
}

export function resolveDisplayName(claims: UserClaims): string {
  const preferred = (claims.name ?? "").trim() || emailLocalPart(claims.email).trim();
  const fallback = preferred || FALLBACK_DISPLAY_NAME;
  return fallback.slice(0, DISPLAY_NAME_MAX_LENGTH);
}

export async function upsertUser(claims: UserClaims): Promise<StoredUser> {
  const displayName = resolveDisplayName(claims);
  const [row] = await getDb()
    .insert(users)
    .values({ id: claims.sub, email: claims.email, displayName })
    .onConflictDoUpdate({
      target: users.id,
      set: { email: claims.email, displayName },
    })
    .returning({ id: users.id, email: users.email, displayName: users.displayName });
  return row;
}
