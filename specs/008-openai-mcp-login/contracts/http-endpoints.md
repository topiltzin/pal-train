# Contract: HTTP Endpoints for the MCP Connector

**Feature**: 008-openai-mcp-login | **Base URL**: the deployed Paltrain origin (`APP_BASE_URL`)

## `POST /mcp` (and `GET`/`DELETE` for the MCP transport)

The MCP endpoint. Every request needs `Authorization: Bearer <access token>`.

| Case | Status | Response |
|------|--------|----------|
| No token | 401 | `WWW-Authenticate: Bearer resource_metadata="<origin>/.well-known/oauth-protected-resource/mcp"` |
| Token invalid, expired, or wrong audience | 401 | `WWW-Authenticate: Bearer error="invalid_token", resource_metadata="..."` |
| Token valid but missing a required scope | 403 | `WWW-Authenticate: Bearer error="insufficient_scope", scope="...", resource_metadata="..."` |
| Connection removed or missing | 403 | JSON error `connection_inactive`. No personal data. |
| Rate limit exceeded | 429 | `Retry-After` header and JSON error `rate_limited` |
| Valid request | 200 | MCP protocol response (tool results per `mcp-tools.md`) |

Every accepted request updates `last_used_at` on the connection. Every refusal writes an audit entry with a reason code.

## `GET /.well-known/oauth-protected-resource/mcp`

RFC 9728 protected resource metadata. Public, no token.

Required content:
- `resource`: `<origin>/mcp`
- `authorization_servers`: the Auth0 issuer, `https://<AUTH0_DOMAIN>/`
- `scopes_supported`: the read-only scope list
- `bearer_methods_supported`: `["header"]`

The response has `Content-Type: application/json` and no secrets.

## `GET /.well-known/oauth-authorization-server`

Mirror of the Auth0 authorization server metadata, for clients that probe the origin directly. Optional: include only if the SDK helper requires it. It is not a second authorization server.

## `GET /connections` (signed-in page, inside the app layout)

Lists the user's connections (spec US3).

- Shows, per connection: `client_name`, `approved_at`, `last_used_at` (or "never"), and status.
- Only `active` connections have a Disconnect control. Removed connections are listed as removed with their removal date.
- Requires a Paltrain session. A signed-out visitor is redirected to sign-in, as the rest of the app does.

## Disconnect action

Triggered from `/connections`. Sets the connection's `status` to `removed` and `removed_at` to now, then writes a `disconnected` audit entry.

- Requires a Paltrain session. The action only affects connections owned by the signed-in user; any other id is rejected as not found.
- Idempotent: disconnecting an already removed connection is a no-op with the same success response.
- Takes effect on the next MCP request, which is refused with `connection_inactive` (spec FR-008, SC-004).

## Consent entry point (depends on research §7)

The connector's sign-in and consent run through Auth0's authorization endpoint for the registered client. Paltrain creates or re-activates its connection record when the first accepted request arrives after approval, or at the consent step if the research §7 spike chooses a Paltrain interstitial. The spike outcome will update this section before User Story 1 tasks are written.

## Verification

- Integration tests (`tests/integration/mcp/mcp-route.test.ts`) cover each row of the status table above using signed test tokens.
- Unit tests cover metadata content (`tests/unit/mcp/mcp-config.test.ts`).
- The disconnect flow is covered end to end (`tests/e2e/mcp-connections.spec.ts`).
