import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { after } from "next/server";
import {
  AUTH_ADAPTER_OPTIONS,
  buildAuthOptions,
  type AuthOptionsSettings,
  type ResetEmailData,
} from "@/lib/auth/auth-options";
import { getEnv } from "@/lib/config/env";
import { getDb } from "@/lib/db/client";
import {
  handleResetRequest,
  type ResetFlowDeps,
  type ResetRequestData,
} from "@/features/auth/password-reset-flow";
import { buildPasswordResetEmail } from "@/features/auth/password-reset-email";
import {
  createResendSender,
  type PasswordResetSender,
} from "@/features/auth/password-reset-sender";
import { logResetEvent } from "@/features/auth/password-reset-log";
import {
  countRecentRequests,
  deleteResetToken,
  deleteResetTokens,
  recordRequest,
} from "@/features/auth/password-reset-requests";
import { getMcpConfig } from "@/features/mcp/mcp-config";

type ResetDelivery = { sender: PasswordResetSender; from: string };
type BaseSettings = Omit<AuthOptionsSettings, "database" | "sendResetPassword">;

/**
 * Queues the reset email for after the response. Better Auth does not wait for delivery, so the
 * reply time does not depend on the email provider, and a delivery failure is logged, not returned.
 */
function queueResetEmail(data: ResetRequestData, { sender, from }: ResetDelivery): void {
  const message = buildPasswordResetEmail({ url: data.url });
  after(() =>
    sender.send({ to: data.user.email, from, ...message }).catch((error: unknown) => {
      console.error("password reset email delivery failed", error);
    }),
  );
}

/** The real side effects of a reset request: the request log, the link table, and the email. */
function resetDeps(delivery: ResetDelivery): ResetFlowDeps {
  return {
    now: () => new Date(),
    countRecent: countRecentRequests,
    record: recordRequest,
    deleteOthers: (userId, keepToken) => deleteResetTokens(userId, keepToken),
    deleteOne: deleteResetToken,
    deliver: (data) => queueResetEmail(data, delivery),
    log: logResetEvent,
  };
}

function createAuth(base: BaseSettings, delivery: ResetDelivery) {
  return betterAuth(
    buildAuthOptions({
      ...base,
      database: drizzleAdapter(getDb(), AUTH_ADAPTER_OPTIONS),
      sendResetPassword: (data: ResetEmailData) => handleResetRequest(data, resetDeps(delivery)),
      onPasswordReset: ({ user }) => {
        logResetEvent("password reset completed", { userId: user.id, email: user.email });
        return Promise.resolve();
      },
    }),
  );
}

export type AuthInstance = ReturnType<typeof createAuth>;

let cachedAuth: AuthInstance | undefined;

/**
 * The Better Auth server instance. It is created on first use, so importing this module does
 * not open a database connection or read the environment.
 */
export function getAuth(): AuthInstance {
  if (!cachedAuth) {
    const env = getEnv();
    const mcp = getMcpConfig();
    cachedAuth = createAuth(
      {
        baseURL: env.BETTER_AUTH_URL,
        secret: env.BETTER_AUTH_SECRET,
        resource: mcp.resource,
      },
      {
        sender: createResendSender({ apiKey: env.RESEND_API_KEY }),
        from: env.PASSWORD_RESET_FROM,
      },
    );
  }
  return cachedAuth;
}
