# Research: Better Auth replacement for Auth0 with MCP compatibility

**Feature**: 010-better-auth-mcp | **Date**: 2026-11-09 | **Spec**: [spec.md](spec.md)

## Current state (what is being replaced)

- Web sign-in: `@auth0/nextjs-auth0` v4. Client in `src/lib/auth/auth0.ts`; middleware in `src/middleware.ts` provides `/auth/login`, `/auth/logout`, `/auth/callback`; session read in `src/features/auth/session.ts` via `getAuth0().getSession()`.
- Connector auth: `src/features/mcp/token-verifier.ts` verifies Auth0 JWTs with `jose` (issuer, audience = `resource`, expiry, `scope`, `sub` as user id, `azp` as client id). JWKS comes from `src/app/mcp/route.ts` via `createRemoteJWKSet`. Issuer and resource come from `src/features/mcp/mcp-config.ts`, which derives them from `AUTH0_DOMAIN` and `APP_BASE_URL`.
- Protected-resource metadata: `src/app/.well-known/oauth-protected-resource/mcp/route.ts`, `authorization_servers` = Auth0 issuer.
- Users: `users.id` (text) holds the Auth0 `sub`. `src/features/auth/user-repository.ts` upserts on first sign-in.
- Tests that depend on Auth0 names: `tests/unit/mcp/mcp-config.test.ts`, `tests/unit/mcp/token-verifier.test.ts`, `tests/integration/mcp/*`, `tests/integration/auth/require-session.test.ts`, `tests/e2e/helpers/sign-in.ts`, and API tests that mock sessions.

## Decision 1: Use Better Auth with its MCP plugin

- **Decision**: Better Auth (`better-auth`) with the `mcp()` plugin, the `jwt()` plugin (signing keys and `/jwks`), and dynamic client registration enabled for the connector.
- **Rationale**: The plugin serves RFC 9728 protected-resource metadata, binds access tokens to a `resource` identifier, and supports dynamic registration (`allowDynamicClientRegistration`) and CIMD. Better Auth is free and open source, stores data in our own Postgres, and keeps all settings in code, so none of them are hidden in a vendor dashboard. This avoids the Auth0 trial limit and the dashboard-only settings that caused the earlier failures.
- **Alternatives considered**:
  - WorkOS AuthKit: managed, but its free tier and DCR behavior were not confirmed, and it needs dashboard settings.
  - Keep Auth0: blocked by the trial limit on third-party client access.
  - Custom authorization server: rejected. It would be more code and risk than the plugin.

## Decision 2: Keep the existing token verifier; point it at Better Auth's keys

- **Decision**: Keep `src/features/mcp/token-verifier.ts` and the gate in `src/features/mcp/mcp-auth.ts`. Change only the inputs: issuer, audience (`https://www.pal-buddy.eu/mcp`), and the JWKS URL.
- **Rationale**: The verifier already has passing unit and integration checks for audience, expiry, scope, and refusal reasons. Reusing it keeps the connection checks, audit entries, and rate limit in `src/app/mcp/route.ts` unchanged.
- **Alternative considered**: `requireMcpAuth` from `@better-auth/mcp`. It verifies the same way (JWKS, issuer, audience, expiry), but it would replace the gate and the refusal mapping that the tests cover. Revisit only if the existing verifier cannot read Better Auth's claims.
- **Open check**: Better Auth may put the client identifier in `azp` or `client_id`. The verifier reads `azp`. A contract test must confirm which claim is present on a real token before cutover.

## Decision 3: Issuer and JWKS location

- **Decision**: The issuer is the Better Auth base URL. The JWKS is at `<base>/jwks` as the plugin serves it. The exact paths are confirmed in the quickstart by fetching the discovery documents.
- **Rationale**: `requireMcpAuth` defaults the JWKS to `${baseURL}/jwks` and the issuer to the resolved base URL, so one base URL setting controls both.
- **Risk**: Better Auth's docs show `https://<host>/api/auth/jwks`, so the base URL may need to include `/api/auth`. The quickstart test is the check.

## Decision 4: Sign-in method for the web app and the connector

- **Decision**: Email and password (Better Auth `emailAndPassword`) on Pal Buddy's own `/sign-in` page. Registration and sign-in both use this method. No social providers in this release.
- **Rationale**: No third-party OAuth app to configure. The spec calls for Pal Buddy's own sign-in. Test accounts are recreated, so there is no migration.
- **Alternative considered**: Google social sign-in. It would need a Google OAuth client per environment. Deferred.

## Decision 5: Session handling

- **Decision**: Server code reads the session with Better Auth's server API (`auth.api.getSession` with the request headers). `src/features/auth/session.ts` keeps its `SessionGetter` contract so handlers and their tests do not change.
- **Rationale**: Keeps the change inside `src/features/auth/` and `src/lib/auth/`, and the existing `SessionLike` shape stays the same.

## Decision 6: Route and middleware layout

- **Decision**: Mount Better Auth's catch-all handler at `src/app/api/auth/[...all]/route.ts`. Remove the Auth0 middleware in `src/middleware.ts`, since route-level checks in `src/app/(app)/layout.tsx` already redirect signed-out users. Replace `/auth/login`, `/auth/logout`, and `/auth/callback` links with Better Auth's sign-in and sign-out calls.
- **Rationale**: Better Auth needs no session-refresh middleware for this app. Removing the middleware also removes the per-request Auth0 session work.
- **Risk**: The app navigation links `LOG_OUT_HREF = "/auth/logout"` and the sign-in page link `/auth/login?returnTo=/`. Both must change, and the tests that assert them must be updated first (TDD).

## Decision 7: Database

- **Decision**: Use Better Auth's Drizzle adapter on the existing Neon Postgres. Generate its tables with the Better Auth CLI into `src/lib/db/auth-schema.ts`, then create a Drizzle migration. Keep `users` and the connection tables. `users.id` will hold the Better Auth user id.
- **Rationale**: One database, one migration tool (`drizzle.config.ts` already exists).
- **Risk**: Integration tests need a reachable Postgres. Earlier in this project the Neon host could not be reached from the development machine (connection timeouts). Integration tests must run from a machine or CI job that can reach the database.

## Decision 8: Connector client registration policy

- **Decision**: Enable dynamic client registration for the connector. Anonymous registration is allowed (ChatGPT registers without a user), but registration grants no access by itself. Default scopes for registered clients are limited to `plans:read` and `library:read`. Consent is required per user.
- **Rationale**: Required by spec FR-003, and by ChatGPT's connector flow.
- **Trade-off**: Anyone can register a client. Access still needs a signed-in user's approval, and only read-only scopes are possible. This trade-off is part of the security review (FR-019).

## Open items carried into implementation

1. Confirm the exact claim names (`azp` or `client_id`, `scope`) on a real Better Auth access token.
2. Confirm the JWKS and discovery paths with the installed version of `better-auth` and `@better-auth/mcp`.
3. Confirm the MCP specification's current registration method, which the CIMD option depends on.
4. Confirm the `@modelcontextprotocol/server` version in use is compatible with the Better Auth MCP helpers.
5. Run the security review (FR-019) before the connector is switched on.

## Resolved open items (T002, against better-auth 1.7.18)

Installed: `better-auth` 1.7.18, `@better-auth/mcp` 1.7.18, `@better-auth/cimd` 1.7.18.

1. **Client claim**: access tokens carry the client id in `azp` (the OAuth provider sets `azp: accessToken.clientId`). The verifier's `azp` read is correct; `client_id` is used only as a fallback.
2. **Audience**: `aud` is set from the resource indicator. The connector must require `aud` = `https://www.pal-buddy.eu/mcp`.
3. **Endpoints** (relative to the Better Auth base path, `/api/auth` when mounted there):
   - `/oauth2/register` (dynamic client registration)
   - `/oauth2/authorize`, `/oauth2/token`, `/oauth2/consent`, `/oauth2/delete-consent`, `/oauth2/revoke`
   - `/jwks` (signing keys; the JWT plugin also serves `/.well-known/jwks.json`)
   - `/.well-known/oauth-authorization-server`, `/.well-known/openid-configuration`
   - `/.well-known/oauth-protected-resource` (served by the MCP plugin)
4. **DCR options** exist in `@better-auth/oauth-provider`: `allowDynamicClientRegistration`, `allowUnauthenticatedClientRegistration`, `clientRegistrationDefaultScopes`, `clientRegistrationDefaultApplicationType`.

## Implementation decision: CIMD deferred (T013, T001)

`@better-auth/cimd` was removed from the dependencies. CIMD makes the server fetch client metadata from URLs the client chooses, which is a new outbound-request surface that the security review (FR-019) would have to cover. Dynamic client registration already satisfies FR-003, so CIMD is deferred until the security review and the MCP spec status are settled. Decision 8 is otherwise unchanged.
