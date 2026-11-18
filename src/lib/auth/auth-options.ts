import type { betterAuth } from "better-auth";
import { jwt } from "better-auth/plugins";
import { mcp } from "@better-auth/mcp";
import * as authSchema from "@/lib/db/auth-schema";

/** The read-only scopes a dynamically registered client receives by default (spec FR-008). */
export const CONNECTOR_DEFAULT_SCOPES = ["plans:read", "library:read"] as const;

/** Standard OpenID scopes. Only the connector scopes above are granted to dynamically registered clients. */
const OIDC_SCOPES = ["openid", "profile", "email", "offline_access"] as const;

export const SIGN_IN_PATH = "/sign-in";
export const CONSENT_PATH = "/consent";
/** The JWT plugin's token endpoint is disabled: session JWTs must never work as access tokens. */
const DISABLED_PATHS = ["/token"];

/** A reset link works for one hour (spec FR-005). */
export const RESET_TOKEN_SECONDS = 60 * 60;

/**
 * The Drizzle adapter settings. `transaction: true` makes a reset spend its token, revoke sessions,
 * and save the password in one transaction, so a failed reset keeps the link usable (research
 * Decision 5). It needs the WebSocket pool in `src/lib/db/client.ts`.
 */
export const AUTH_ADAPTER_OPTIONS = {
  provider: "pg" as const,
  schema: authSchema,
  transaction: true as const,
};

/** What Better Auth passes to the reset handler: the account, the one-time link, and its token. */
export type ResetEmailData = { user: { id: string; email: string }; url: string; token: string };

export type AuthOptionsSettings = {
  baseURL: string;
  secret: string;
  /** The MCP protected resource identifier (the audience of every connector token). */
  resource: string;
  /** The Drizzle adapter or database handle. */
  database: Parameters<typeof betterAuth>[0]["database"];
  /** Delivers the reset link. Better Auth does not wait for it (see better-auth.ts). */
  sendResetPassword: (data: ResetEmailData) => Promise<void>;
  /** Runs after a password has been reset and its sessions revoked. Used for the completion log. */
  onPasswordReset?: (data: { user: { id: string; email: string } }) => Promise<void>;
};

/** Pure: the MCP plugin settings for the connector (FR-003, FR-005, FR-008). */
export function buildMcpSettings(resource: string) {
  return {
    loginPage: SIGN_IN_PATH,
    consentPage: CONSENT_PATH,
    resource,
    allowDynamicClientRegistration: true,
    allowUnauthenticatedClientRegistration: true,
    scopes: [...OIDC_SCOPES, ...CONNECTOR_DEFAULT_SCOPES],
    /** Scopes a client may ask for when it registers: the OpenID scopes are allowed, not granted. */
    clientRegistrationAllowedScopes: [...OIDC_SCOPES, ...CONNECTOR_DEFAULT_SCOPES],
    clientRegistrationDefaultScopes: [...CONNECTOR_DEFAULT_SCOPES],
  };
}

/**
 * Pure: builds the Better Auth configuration. It does not open a database connection, so the
 * settings can be checked without network access.
 */
export function buildAuthOptions(settings: AuthOptionsSettings) {
  return {
    baseURL: settings.baseURL,
    secret: settings.secret,
    database: settings.database,
    emailAndPassword: {
      enabled: true,
      resetPasswordTokenExpiresIn: RESET_TOKEN_SECONDS,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: settings.sendResetPassword,
      onPasswordReset: settings.onPasswordReset,
    },
    // Database storage, so the counters are shared by every server instance (research Decision 3).
    rateLimit: { enabled: true, storage: "database" as const },
    disabledPaths: DISABLED_PATHS,
    plugins: [jwt({ disableSettingJwtHeader: true }), mcp(buildMcpSettings(settings.resource))],
  };
}
