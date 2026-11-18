import { decideResetRequest } from "@/features/auth/password-reset-limit";

export type ResetRequestData = {
  user: { id: string; email: string };
  url: string;
  token: string;
};

/** The side effects a reset request needs. The real ones are wired in better-auth.ts. */
export type ResetFlowDeps = {
  now: () => Date;
  countRecent: (userId: string, now: Date) => Promise<Date[]>;
  record: (userId: string, requestedAt: Date) => Promise<void>;
  /** Removes the account's older links, keeping the new one. */
  deleteOthers: (userId: string, keepToken: string) => Promise<void>;
  /** Removes one link, the refused request's own. */
  deleteOne: (token: string) => Promise<void>;
  /** Queues the email. It must not block the response. */
  deliver: (data: ResetRequestData) => void;
  log: (
    event: "password reset requested" | "password reset refused",
    who: { userId: string; email: string },
  ) => void;
};

/**
 * Runs after Better Auth has created the reset token and before the response returns. Over the
 * per-account limit (spec FR-010), the request is refused: no email, no record, and only its own
 * new token is removed, so an older valid link still works. Under the limit, older links are
 * replaced (spec FR-006), the request is recorded, and the email is queued.
 */
export async function handleResetRequest(
  data: ResetRequestData,
  deps: ResetFlowDeps,
): Promise<void> {
  const now = deps.now();
  const who = { userId: data.user.id, email: data.user.email };
  const recent = await deps.countRecent(data.user.id, now);
  if (decideResetRequest(recent, now) === "refuse") {
    await deps.deleteOne(data.token);
    deps.log("password reset refused", who);
    return;
  }
  await deps.deleteOthers(data.user.id, data.token);
  await deps.record(data.user.id, now);
  deps.log("password reset requested", who);
  deps.deliver(data);
}
