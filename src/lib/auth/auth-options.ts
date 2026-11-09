import type { betterAuth } from "better-auth";
import { jwt } from "better-auth/plugins";
import { mcp } from "@better-auth/mcp";

/** The read-only scopes a dynamically registered client receives by default (spec FR-008). */
export const CONNECTOR_DEFAULT_SCOPES = ["plans:read", "library:read"] as const;

/** Standard OpenID scopes. Only the connector scopes above are granted to dynamically registered clients. */
const OIDC_SCOPES = ["openid", "profile", "email", "offline_access"] as const;

export const SIGN_IN_PATH = "/sign-in";
export const CONSENT_PATH = "/consent";
/** The JWT plugin's token endpoint is disabled: session JWTs must never work as access tokens. */
const DISABLED_PATHS = ["/token"];

export type AuthOptionsSettings = {
  baseURL: string;
  secret: string;
  /** The MCP protected resource identifier (the audience of every connector token). */
  resource: string;
  /** The Drizzle adapter or database handle. */
  database: Parameters<typeof betterAuth>[0]["database"];
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
    emailAndPassword: { enabled: true },
    disabledPaths: DISABLED_PATHS,
    plugins: [jwt({ disableSettingJwtHeader: true }), mcp(buildMcpSettings(settings.resource))],
  };
}
