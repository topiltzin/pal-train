import { headers } from "next/headers";
import { getAuth } from "@/lib/auth/better-auth";

export type SessionUser = {
  /** The Better Auth user id. It is the key of the app's `users` row. */
  sub: string;
  email: string;
  name?: string;
};

export type SessionLike = {
  user: SessionUser;
};

export type SessionGetter = () => Promise<SessionLike | null>;

/** The shape of a Better Auth server session that the app reads. */
type BetterAuthSession = {
  user: { id: string; email: string; name?: string | null };
} | null;

export class UnauthenticatedError extends Error {
  constructor() {
    super("Please sign in to continue.");
    this.name = "UnauthenticatedError";
  }
}

/**
 * Pure: maps a Better Auth session to the app's user. A session without an email cannot create
 * a user row (email is required), so it counts as signed out.
 */
export function toSessionUser(session: BetterAuthSession): SessionUser | null {
  if (!session?.user?.email) {
    return null;
  }
  return {
    sub: session.user.id,
    email: session.user.email,
    name: session.user.name ?? undefined,
  };
}

const defaultGetSession: SessionGetter = async () => {
  const session = await getAuth().api.getSession({ headers: await headers() });
  const user = toSessionUser(session);
  return user ? { user } : null;
};

export async function getCurrentUser(
  getSession: SessionGetter = defaultGetSession,
): Promise<SessionUser | null> {
  const session = await getSession();
  return session?.user ?? null;
}

export async function requireUser(
  getSession: SessionGetter = defaultGetSession,
): Promise<SessionUser> {
  const user = await getCurrentUser(getSession);
  if (!user) {
    throw new UnauthenticatedError();
  }
  return user;
}
