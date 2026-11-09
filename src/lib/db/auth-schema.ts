/**
 * Better Auth tables for Postgres, written from Better Auth's own table definitions
 * (`getAuthTables`) for this configuration: email and password, the JWT plugin, and the OAuth
 * provider that the MCP plugin wraps. The Better Auth CLI generator is not published for
 * version 1.7, so these definitions are kept in step with `getAuthTables` by the schema check
 * in tests/unit/auth/auth-schema.test.ts.
 */
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

const idColumn = () => text("id").primaryKey();
const createdAtColumn = () =>
  timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAtColumn = () =>
  timestamp("updated_at", { withTimezone: true }).notNull().defaultNow();
const optionalTimestamp = (name: string) => timestamp(name, { withTimezone: true });

export const user = pgTable(
  "user",
  {
    id: idColumn(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    emailVerified: boolean("email_verified").notNull().default(false),
    image: text("image"),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => [uniqueIndex("user_email_unique").on(table.email)],
);

export const session = pgTable(
  "session",
  {
    id: idColumn(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull(),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [
    uniqueIndex("session_token_unique").on(table.token),
    index("session_user_id_idx").on(table.userId),
  ],
);

export const account = pgTable(
  "account",
  {
    id: idColumn(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: optionalTimestamp("access_token_expires_at"),
    refreshTokenExpiresAt: optionalTimestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => [index("account_user_id_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: idColumn(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

/** Signing keys for access tokens (the JWT plugin). No endpoint returns the private key. */
export const jwks = pgTable("jwks", {
  id: idColumn(),
  publicKey: text("public_key").notNull(),
  privateKey: text("private_key").notNull(),
  createdAt: createdAtColumn(),
  expiresAt: optionalTimestamp("expires_at"),
  alg: text("alg"),
  crv: text("crv"),
});

/** Dynamically registered clients, such as the ChatGPT connector. */
export const oauthClient = pgTable("oauth_client", {
  id: idColumn(),
  clientId: text("client_id").notNull().unique(),
  clientSecret: text("client_secret"),
  clientDiscoveryId: text("client_discovery_id"),
  disabled: boolean("disabled").default(false),
  skipConsent: boolean("skip_consent").default(false),
  enableEndSession: boolean("enable_end_session").default(false),
  subjectType: text("subject_type"),
  scopes: text("scopes").array(),
  clientCredentialsScopes: text("client_credentials_scopes").array(),
  userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
  createdAt: optionalTimestamp("created_at"),
  updatedAt: optionalTimestamp("updated_at"),
  name: text("name"),
  uri: text("uri"),
  icon: text("icon"),
  contacts: text("contacts").array(),
  tos: text("tos"),
  policy: text("policy"),
  softwareId: text("software_id"),
  softwareVersion: text("software_version"),
  softwareStatement: text("software_statement"),
  redirectUris: text("redirect_uris").array().notNull(),
  postLogoutRedirectUris: text("post_logout_redirect_uris").array(),
  backchannelLogoutUri: text("backchannel_logout_uri"),
  backchannelLogoutSessionRequired: boolean("backchannel_logout_session_required"),
  tokenEndpointAuthMethod: text("token_endpoint_auth_method"),
  applicationType: text("application_type"),
  jwks: text("jwks"),
  jwksUri: text("jwks_uri"),
  grantTypes: text("grant_types").array(),
  responseTypes: text("response_types").array(),
  requirePKCE: boolean("require_pkce").default(true),
  dpopBoundAccessTokens: boolean("dpop_bound_access_tokens"),
  referenceId: text("reference_id"),
  metadata: jsonb("metadata"),
});

/** Protected resources, identified by their resource indicator (for example the MCP URL). */
export const oauthResource = pgTable(
  "oauth_resource",
  {
    id: idColumn(),
    identifier: text("identifier").notNull(),
    name: text("name").notNull(),
    accessTokenTtl: integer("access_token_ttl"),
    refreshTokenTtl: integer("refresh_token_ttl"),
    signingAlgorithm: text("signing_algorithm"),
    signingKeyId: text("signing_key_id"),
    allowedScopes: text("allowed_scopes").array(),
    customClaims: jsonb("custom_claims"),
    dpopBoundAccessTokensRequired: boolean("dpop_bound_access_tokens_required"),
    disabled: boolean("disabled").default(false),
    createdAt: optionalTimestamp("created_at"),
    updatedAt: optionalTimestamp("updated_at"),
    policyVersion: integer("policy_version"),
    metadata: jsonb("metadata"),
  },
  (table) => [uniqueIndex("oauth_resource_identifier_unique").on(table.identifier)],
);

/** Which protected resources a dynamically registered client may request. */
export const oauthClientResource = pgTable("oauth_client_resource", {
  id: idColumn(),
  clientId: text("client_id").notNull(),
  resourceId: text("resource_id").notNull(),
  metadata: jsonb("metadata"),
  createdAt: optionalTimestamp("created_at"),
});

/** The approval a user gave a client. Revoking it ends that client's access. */
export const oauthConsent = pgTable(
  "oauth_consent",
  {
    id: idColumn(),
    clientId: text("client_id")
      .notNull()
      .references(() => oauthClient.clientId, { onDelete: "cascade" }),
    userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
    referenceId: text("reference_id"),
    resources: text("resources").array(),
    requestedUserInfoClaims: text("requested_user_info_claims").array(),
    scopes: text("scopes").array().notNull(),
    createdAt: optionalTimestamp("created_at"),
    updatedAt: optionalTimestamp("updated_at"),
  },
  (table) => [index("oauth_consent_user_id_idx").on(table.userId)],
);

export const oauthAccessToken = pgTable(
  "oauth_access_token",
  {
    id: idColumn(),
    token: text("token"),
    clientId: text("client_id")
      .notNull()
      .references(() => oauthClient.clientId, { onDelete: "cascade" }),
    sessionId: text("session_id").references(() => session.id, { onDelete: "set null" }),
    userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
    referenceId: text("reference_id"),
    authorizationCodeId: text("authorization_code_id"),
    resources: text("resources").array(),
    requestedUserInfoClaims: text("requested_user_info_claims").array(),
    refreshId: text("refresh_id"),
    expiresAt: optionalTimestamp("expires_at"),
    createdAt: optionalTimestamp("created_at"),
    revoked: optionalTimestamp("revoked"),
    confirmation: jsonb("confirmation"),
    scopes: text("scopes").array().notNull(),
  },
  (table) => [index("oauth_access_token_user_id_idx").on(table.userId)],
);

export const oauthRefreshToken = pgTable(
  "oauth_refresh_token",
  {
    id: idColumn(),
    token: text("token").notNull(),
    clientId: text("client_id")
      .notNull()
      .references(() => oauthClient.clientId, { onDelete: "cascade" }),
    sessionId: text("session_id").references(() => session.id, { onDelete: "set null" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    referenceId: text("reference_id"),
    authorizationCodeId: text("authorization_code_id"),
    resources: text("resources").array(),
    requestedUserInfoClaims: text("requested_user_info_claims").array(),
    expiresAt: optionalTimestamp("expires_at"),
    createdAt: optionalTimestamp("created_at"),
    revoked: optionalTimestamp("revoked"),
    rotatedAt: optionalTimestamp("rotated_at"),
    rotationReplayResponse: text("rotation_replay_response"),
    rotationReplayExpiresAt: optionalTimestamp("rotation_replay_expires_at"),
    authTime: optionalTimestamp("auth_time"),
    confirmation: jsonb("confirmation"),
    scopes: text("scopes").array().notNull(),
  },
  (table) => [uniqueIndex("oauth_refresh_token_token_unique").on(table.token)],
);

export const oauthClientAssertion = pgTable("oauth_client_assertion", {
  id: idColumn(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

/** Tables passed to the Drizzle adapter, keyed by Better Auth model name. */
export const authSchema = {
  user,
  session,
  account,
  verification,
  jwks,
  oauthClient,
  oauthClientResource,
  oauthResource,
  oauthConsent,
  oauthAccessToken,
  oauthRefreshToken,
  oauthClientAssertion,
};
