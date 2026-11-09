# Data Model: Better Auth replacement

**Feature**: 010-better-auth-mcp | **Spec**: [spec.md](spec.md) | **Research**: [research.md](research.md)

## Existing entities that change meaning

### users (existing table, `src/lib/db/schema.ts`)

| Field | Type | Change |
|-------|------|--------|
| id | text, primary key | Now holds the Better Auth user id instead of the Auth0 `sub`. No schema change. |
| email | text, unique, required | Unchanged. Supplied at registration. |
| display_name | text, 1 to the existing max length | Unchanged. Shared with ChatGPT (FR-014). |
| created_at | timestamptz | Unchanged. |

Validation: email required (a session without an email counts as signed out, as today). Display name rules unchanged.

### connections, access audit, rate counter (existing, unchanged)

- Keyed by `user_id` (references `users.id`) and `client_id` (text). `client_id` now holds the Better Auth OAuth client id issued by dynamic registration.
- The `users.id` change keeps every foreign key valid, because the keys reference the same column.

## New entities (Better Auth, generated)

Better Auth's CLI generates these tables into `src/lib/db/auth-schema.ts`. The core tables and the plugin tables are listed by role; their exact column names come from the generator and are confirmed when it runs.

| Role | Table (expected name) | Key fields | Notes |
|------|----------------------|------------|-------|
| Account | `user` | id, name, email, email_verified, created_at, updated_at | Source of truth for the user id. Synced into `users` on first sign-in. |
| Session | `session` | id, user_id, token, expires_at, ip_address, user_agent | Web session. Cascade-deleted with the user. |
| Credential | `account` | id, user_id, provider_id, password hash | Holds the email and password credential. |
| Verification | `verification` | id, identifier, value, expires_at | Used for email verification and reset tokens. |
| Signing keys | `jwks` (from `jwt()`) | id, public_key, private_key, created_at | Signs access tokens. Private key is stored encrypted by Better Auth; it is never returned by any endpoint. |
| OAuth client | `oauthApplication` (from `mcp()`) | client_id, client_secret (hashed), redirect_uris, name, created_at | One row per dynamically registered client, such as ChatGPT. |
| Consent | `oauthConsent` (from `mcp()`) | user_id, client_id, scopes, created_at | The approval a user gave. Revoked when the user disconnects. |
| Access token | `oauthAccessToken` (from `mcp()`) | id, client_id, user_id, scopes, expires_at, revoked_at | Opaque or JWT depending on configuration; the connector verifies JWTs. |

## Relationships

- `user` 1 — many `session`, `account`, `oauthConsent`.
- `user` 1 — 1 `users` row (same id; created on first sign-in).
- `oauthApplication` 1 — many `oauthConsent`, `oauthAccessToken`.
- `users` 1 — many `connections` (one per approved client).

## State transitions

**Connection** (existing feature 008 model, unchanged):

```text
(none) --consent approved--> active --user disconnects--> removed
removed --user reconnects and approves again--> active
```

**Access token** (spec FR-009, FR-012):

```text
issued --expires after 1 hour--> expired
issued --user disconnects (consent revoked)--> revoked
```

Revocation must take effect within one minute (FR-012). The connector checks the connection on every request (`src/features/mcp/connection-check.ts`), so a revoked consent is refused on the next request.

## Validation rules from the spec

- Access tokens carry the MCP resource as `aud`; any other audience is refused (FR-005, FR-010).
- Granted scopes are limited to `plans:read` and `library:read` (FR-008).
- Email, sign-in identifier, and mood history are never placed in connector responses (FR-014).
- Client secrets and session secrets are stored hashed or encrypted and never logged (FR-016).
