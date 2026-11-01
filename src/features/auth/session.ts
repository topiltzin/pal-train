import { getAuth0 } from "@/lib/auth/auth0";

export type SessionUser = {
  sub: string;
  email: string;
  name?: string;
};

export type SessionLike = {
  user: SessionUser;
};

export type SessionGetter = () => Promise<SessionLike | null>;

export class UnauthenticatedError extends Error {
  constructor() {
    super("Please sign in to continue.");
    this.name = "UnauthenticatedError";
  }
}

// A session without an email cannot create a user row (email is required), so it counts as signed out.
const defaultGetSession: SessionGetter = async () => {
  const session = await getAuth0().getSession();
  if (!session?.user?.email) {
    return null;
  }
  return {
    user: { sub: session.user.sub, email: session.user.email, name: session.user.name },
  };
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
