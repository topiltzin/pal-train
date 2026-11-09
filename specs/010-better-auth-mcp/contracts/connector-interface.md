# Contract: Connector and sign-in interfaces

**Feature**: 010-better-auth-mcp | **Data model**: [data-model.md](../data-model.md)

This contract lists what outside clients (ChatGPT, the web browser) can call. The MCP tools themselves do not change: `list_focus_areas`, `list_exercises`, and `plan_session` keep their inputs and outputs from feature 008.

Base URL: `https://www.pal-buddy.eu` (local development: `http://localhost:3000`).

## 1. Protected-resource metadata (RFC 9728)

`GET /.well-known/oauth-protected-resource/mcp`

Response `200`, JSON:

```json
{
  "resource": "https://www.pal-buddy.eu/mcp",
  "authorization_servers": ["<issuer>"],
  "scopes_supported": ["plans:read", "library:read"],
  "bearer_methods_supported": ["header"]
}
```

- `authorization_servers` must equal the Better Auth issuer. It replaces the Auth0 issuer.
- `resource` must equal the audience every access token carries.

## 2. MCP endpoint

`POST /mcp` (also `GET` and `DELETE`, as today)

| Case | Status | Headers | Body |
|------|--------|---------|------|
| No `Authorization` header | 401 | `WWW-Authenticate: Bearer ... resource_metadata="<metadata URL>"` | `{"error":"invalid_token",...}` |
| Token invalid, expired, or wrong audience | 401 | same challenge | no personal data |
| Token lacks `plans:read` or `library:read` for the requested tool | 403 | `insufficient_scope` challenge | no personal data |
| Connection removed (user disconnected) | 403 | none | `{"error":"connection_inactive"}` |
| Rate limit exceeded | 429 | `Retry-After` | `{"error":"rate_limited","message":...}` |
| Valid token, valid connection | 200 | JSON-RPC response | tool result |

Rules:
- The token's `aud` must equal `https://www.pal-buddy.eu/mcp`. Any other audience is refused (FR-005).
- The token's `sub` is the user id. Only that user's data is returned (FR-011).
- The client identifier is read from `azp` (or `client_id`, to be confirmed by the contract test in quickstart step 6).

## 3. Authorization server (Better Auth, served under `/api/auth`)

| Endpoint | Purpose | Notes |
|----------|---------|-------|
| `GET /.well-known/oauth-authorization-server` (or the OpenID configuration path the plugin serves) | Discovery | Advertises `registration_endpoint` when dynamic registration is on |
| `POST /oauth2/register` | Dynamic client registration | Anonymous allowed; returns client id; grants no access by itself (FR-003) |
| `GET /oauth2/authorize` | Authorization request | Requires `response_type=code`, PKCE `code_challenge` with `S256`, `resource` = MCP URL (FR-004, FR-005) |
| Login page `/sign-in` | Email and password sign-in | Pal Buddy's own page (FR-006) |
| Consent page `/consent` | Approve or cancel the connector | Names Pal Buddy and ChatGPT and lists scopes (FR-007) |
| `POST /oauth2/token` | Code exchange and refresh | Access token lifetime 3600 s (FR-009) |
| `GET /jwks` (under the auth base path) | Public signing keys | Used by the connector to verify tokens |
| Connection removal | Disconnect action in Pal Buddy's connections page | Revokes consent; access ends within one minute (FR-012) |

Redirect URIs for the web app: `https://www.pal-buddy.eu/api/auth/callback/*` and `http://localhost:3000/api/auth/callback/*`.

## 4. Web app session

| Route | Behavior |
|-------|----------|
| `/sign-in` | Email and password form. Replaces `/auth/login`. |
| `POST /api/auth/sign-out` (called by the logout control) | Ends the web session. Replaces `/auth/logout`. |
| Protected pages | Redirect to `/sign-in` when there is no session (existing `(app)/layout.tsx` behavior). |

## Errors shared by all interfaces

- Error bodies never include email addresses, sign-in identifiers, tokens, or client secrets (FR-016, SC-007).
- Auth provider outages return a "temporarily unavailable" message. They never accept a request without a valid token (spec edge case).
