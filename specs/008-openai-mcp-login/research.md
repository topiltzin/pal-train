# Research: OpenAI MCP Sign-In for Paltrain

**Feature**: 008-openai-mcp-login | **Date**: 2026-11-07

## 1. Who issues the tokens: Auth0, not Paltrain

**Decision**: Auth0 (the tenant Paltrain already uses) is the OAuth authorization server. Paltrain is a resource server only. It verifies Auth0 access tokens on each MCP request and never mints tokens.

**Rationale**: The MCP TypeScript SDK's authorization docs state the split directly: a resource server verifies tokens with `requireBearerAuth` and a verifier function, and "the SDK never issues tokens" ([MCP TypeScript SDK, serving/authorization](https://github.com/modelcontextprotocol/typescript-sdk/blob/main/docs/serving/authorization.md)). Building an authorization server inside a Next.js app would add a large, security-critical surface that the spec does not need. Reusing the existing Auth0 tenant keeps one account system (spec Assumptions).

**Alternatives considered**: Paltrain as its own OAuth server. Rejected: more code, more risk, and it duplicates Auth0. The SDK's legacy authorization-server helpers are frozen and not recommended ([same doc](https://github.com/modelcontextprotocol/typescript-sdk/blob/main/docs/serving/authorization.md)).

## 2. Client registration: what ChatGPT supports

**Decision**: Configure the Auth0 tenant so ChatGPT can register using Client ID Metadata Documents (CIMD) where Auth0 supports them, and keep dynamic client registration (DCR) as the fallback. Confirm the exact setting in the Auth0 tenant during the first implementation task.

**Rationale**: ChatGPT supports three client identification methods, CIMD, DCR, and predefined clients, and prefers CIMD when available ([OpenAI, apps-sdk auth](https://developers.openai.com/apps-sdk/build/auth)). Auth0's own guidance recommends manual CIMD registration over DCR for production MCP deployments, and it flags an open DCR endpoint as a risk ([Auth0, MCP docs](https://auth0.com/ai/docs/mcp/intro/why-auth-for-mcp)). The MCP spec has changed its stance on DCR across versions: the 2025-06-18 revision says SHOULD, the 2025-11-25 revision downgrades it to MAY and prefers CIMD ([MCP authorization spec](https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization)).

**Alternatives considered**: Predefined client only. Rejected as the sole option because it needs a manual setup step per connector instance. DCR only. Rejected because of the risk Auth0 names.

**Open item**: confirm in the Auth0 tenant which of CIMD or DCR is available before implementation. Either works with ChatGPT.

## 3. Redirect URI and issuer identification

**Decision**: Register the redirect URI that the ChatGPT connector page shows (`https://chatgpt.com/connector/oauth/{callback_id}`) in the Auth0 application's allowlist, exactly as displayed. Support the issuer identification ChatGPT expects (RFC 9207 `iss` in the authorization response) if Auth0 provides it; otherwise ChatGPT falls back to the callback-ID-specific URI.

**Rationale**: OpenAI's docs say to copy the URI exactly into the allowlist and that ChatGPT uses the stable URI only when the authorization server meets the issuer-identification requirements ([OpenAI, apps-sdk auth](https://developers.openai.com/apps-sdk/build/auth)). The redirect URI is per connector instance, so it is known only after the connector is created in OpenAI.

**Open item**: check whether the Auth0 tenant emits RFC 9207 `iss`. Record the answer in `quickstart.md`.

## 4. Protected resource metadata and the challenge

**Decision**: The MCP route returns `401` with a `WWW-Authenticate: Bearer` challenge that points at the RFC 9728 protected resource metadata URL. Paltrain serves that metadata document, listing Auth0 as the authorization server. The metadata also lists the resource identifier `https://<paltrain-host>/mcp`.

**Rationale**: The MCP spec requires servers to implement RFC 9728 protected resource metadata and clients to use it for discovery ([MCP authorization spec](https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization)). The SDK's `mcpAuthMetadataRouter` and `getOAuthProtectedResourceMetadataUrl` produce these documents ([MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk/blob/main/docs/serving/authorization.md)). OpenAI also requires that the server host protected resource metadata and echo the `resource` parameter through the OAuth flow ([OpenAI, apps-sdk auth](https://developers.openai.com/apps-sdk/build/auth)).

## 5. Token verification

**Decision**: Verify each access token locally against Auth0's published signing keys (JWKS). Check the signature, the issuer, the expiry, and that the audience equals this server's resource identifier. Reject tokens that do not match. Require the scope set the connector was granted.

**Rationale**: The SDK's verifier pattern maps a verified JWT to an `AuthInfo` object, populates `expiresAt`, and sets `resource` for `expectedResource` validation ([MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk/blob/main/docs/serving/authorization.md)). Local verification needs no call to Auth0 on each request, which keeps latency low.

**Library**: `jose` for JWT and JWKS handling. It is a widely used, dependency-light library, and it is justified by the constitution's rule that solved problems use well-maintained libraries.

## 6. Making disconnect take effect within one minute

**Decision**: Paltrain keeps its own connection record. Every MCP request checks that the caller's (user, client) connection is still active. Disconnecting in Paltrain sets the record to removed, and the next request is refused.

**Rationale**: Auth0 token revocation is not required to meet FR-008 and SC-004, and it depends on tenant features the spec does not need. A check against Paltrain's own table is immediate and testable. Access tokens still expire within one hour (FR-005) as a second layer.

**Alternatives considered**: Relying on Auth0 grant revocation alone. Rejected: the revocation timing and API surface are less certain than a local check. Short tokens alone. Rejected: a removed connection would still work until expiry, which can be up to an hour.

## 7. Consent text (FR-003)

**Decision**: Use Auth0's authorization consent for the third-party connector first. The consent must name Paltrain, name OpenAI, and list the data shared (display name and plan or library content).

**Open item (spike, blocking before implementation of User Story 1)**: Auth0's consent screen may not show the required custom text. If it cannot, the fallback is a Paltrain-hosted interstitial after sign-in that shows the required text and records the approval. The spike outcome is recorded here before tasks are generated.

**Why this is not a planning blocker**: the requirement is clear, and both routes meet it. Only the mechanism is unverified.

## 8. Rate limiting (FR-013)

**Decision**: Count requests per user in a Postgres table, one row per user per one-minute window, and refuse requests over a fixed limit with a retry message.

**Rationale**: The app runs on Vercel serverless, where in-memory counters do not persist between instances. A database counter is consistent across instances and reuses the existing Neon database. The limit value is a default to confirm during planning (spec Assumptions).

**Alternatives considered**: In-memory counter. Rejected: not shared across instances. A separate rate-limit service. Rejected for now: a new vendor and a new bill for a small need.

## 9. MCP tool surface (FR-004, FR-011, FR-012)

**Decision**: Three read-only tools:
- `list_focus_areas`: returns the focus areas (ids and labels).
- `list_exercises`: returns exercises for one focus area, with name, minutes, equipment, and the medical notice text the app shows.
- `plan_session`: returns a plan for a mood, a focus, and a length, using the same planning function the app uses (`planSession`), so the results match.

**Rationale**: These match the app's existing read paths: the focus-area and session-plan API routes already exist (`src/app/api/focus-areas`, `src/app/api/session-plan`). Reusing the same planning function satisfies FR-011 directly.

## 10. Transport and hosting

**Decision**: Serve the MCP endpoint at `/mcp` as a Next.js route handler on the same Vercel deployment, using the SDK's web-standard bearer gate (`requireBearerAuth`) in front of the MCP handler.

**Rationale**: The SDK documents the same gate for web-standard `fetch` hosts; the Express middleware adapts the same core ([MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk/blob/main/docs/serving/authorization.md)). Hosting beside the app reuses the database and the exercise library (spec Assumptions).

**Version note**: the SDK docs describe the v2 split packages (`@modelcontextprotocol/server`, `@modelcontextprotocol/node`, `@modelcontextprotocol/express`). Pin the exact version that matches the docs at implementation time and record it in `quickstart.md`.

## 11. Dependencies to add

- `@modelcontextprotocol/server` (MCP server and bearer gate), pinned.
- `jose` (JWT and JWKS verification), pinned.

Both are justified in `plan.md` under the constitution's dependency rule.

## Open items summary

1. Confirm CIMD or DCR availability in the Auth0 tenant (section 2).
2. Confirm RFC 9207 `iss` support in the Auth0 tenant (section 3).
3. Consent spike: Auth0 custom consent text versus a Paltrain interstitial (section 7). Blocks User Story 1 tasks.
4. Pin exact SDK and `jose` versions (sections 10 and 11).
