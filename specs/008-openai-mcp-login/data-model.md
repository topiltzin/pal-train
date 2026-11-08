# Data Model: OpenAI MCP Sign-In for Paltrain

**Feature**: 008-openai-mcp-login | **Date**: 2026-11-07

Three new tables in the app's Neon database. Existing tables (`users`, `exercise_demo_links`, `suggestion_state`) are unchanged. Tokens are never stored: Auth0 issues them and Paltrain only verifies them.

## Connection (`mcp_connections`)

One approved link between a Paltrain user and an OpenAI connector client.

| Field | Type | Rule |
|-------|------|------|
| `id` | integer, generated | Primary key |
| `user_id` | text | References `users.id`, cascade on delete |
| `client_id` | text | The OAuth client identifier Auth0 issued to the connector. At most 255 characters. |
| `client_name` | text | Display name shown to the user, for example "OpenAI". At most 100 characters. |
| `granted_scopes` | text, space-separated | Scopes the approval covers. Only the read-only scopes are allowed. |
| `status` | enum: `active`, `removed` | Starts `active` on approval. Set to `removed` on disconnect. |
| `approved_at` | timestamp with time zone | Set when the user approves. Updated on re-approval. |
| `last_used_at` | timestamp with time zone, nullable | Updated on each accepted request. |
| `removed_at` | timestamp with time zone, nullable | Set on disconnect. |

**Uniqueness**: one row per (`user_id`, `client_id`). Reconnecting after a disconnect sets `status` back to `active`, sets a new `approved_at`, and clears `removed_at`. No second row is created.

**State transitions**:
- (none) → `active`: user approves consent.
- `active` → `removed`: user disconnects in Paltrain. Immediate.
- `removed` → `active`: user reconnects and approves again. Goes through sign-in and consent again (spec US3 scenario 3).

**Validation rules** (from spec FR-004, FR-009):
- `granted_scopes` must be a subset of the allowed read-only scope list. Any other value is rejected at write time.
- `approved_at` must be set when `status` is `active`.

## Audit Entry (`mcp_audit_entries`)

An append-only record of security-relevant events (spec FR-015).

| Field | Type | Rule |
|-------|------|------|
| `id` | integer, generated | Primary key |
| `created_at` | timestamp with time zone | Set at write time |
| `event` | enum: `consent_granted`, `consent_denied`, `token_accepted`, `token_refused`, `connection_refused`, `disconnected`, `rate_limited` | Required |
| `user_id` | text, nullable | Internal account identifier only. Null when the token could not be linked to a user. |
| `client_id` | text, nullable | The connector client. |
| `reason_code` | text, nullable | A short code such as `expired`, `wrong_audience`, `missing_scope`, `removed`, `rate_limited`. Never a token, code, or personal value. |

**Validation rules**: the table must never receive a token, an authorization code, an email address, a display name, or a mood value. Writers pass only the fields above. Unit tests assert this for each writer.

**Retention**: kept for 90 days, then deleted by a scheduled cleanup. The number is a default to confirm during planning.

## Rate Window (`mcp_rate_windows`)

Counts requests per user in one-minute windows (spec FR-013).

| Field | Type | Rule |
|-------|------|------|
| `user_id` | text | References `users.id`, cascade on delete |
| `window_start` | timestamp with time zone | The start of the one-minute window, truncated to the minute |
| `request_count` | integer | At least 0. Incremented per accepted request. |

**Primary key**: (`user_id`, `window_start`).

**Rule**: a request is refused with a retry message when `request_count` has reached the fixed per-minute limit (default 60, a named constant). Old windows are removed by the same cleanup as audit entries.

## Relationships

- User 1 → many Connections (one per connector client).
- User 1 → many Rate Windows (one per minute with activity).
- User 1 → many Audit Entries (may be null for refusals before linking).

## Access rule (FR-007)

Every MCP request resolves the token's subject to a user, and reads only that user's data. A request is accepted only when:
1. The token verifies (signature, issuer, audience, expiry, scopes), and
2. A Connection exists for (user, client) with `status = active`, and
3. The rate window is under the limit.

Any failure writes an audit entry with a reason code and returns an error that reveals no personal data.
