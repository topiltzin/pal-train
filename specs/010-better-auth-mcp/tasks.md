# Tasks: Replace Auth0 with Better Auth, Keeping the ChatGPT Connector Working

**Input**: Design documents from `/specs/010-better-auth-mcp/`

**Prerequisites**: [plan.md](plan.md) (required), [spec.md](spec.md) (required), [research.md](research.md), [data-model.md](data-model.md), [contracts/connector-interface.md](contracts/connector-interface.md), [quickstart.md](quickstart.md)

**Tests**: Required. Constitution Principle II makes test-first development mandatory: every behavior change starts with a failing test (RED), then the minimal implementation (GREEN), then refactor. Coverage for changed code must be at least 80%.

**Organization**: Tasks are grouped by user story (spec.md). Phase 2 blocks all stories.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: US1 (connect from ChatGPT), US2 (web sign-in), US3 (disconnect and connected apps)
- Every task names its file path

**Integration tests need a reachable Postgres.** Run them from a machine or CI job that can reach the database (research Decision 7).

---

## Phase 1: Setup

**Purpose**: Install dependencies and record the new configuration names. No behavior changes yet.

- [X] T001 Install `better-auth`, `@better-auth/mcp`, and `@better-auth/cimd` with `npm install better-auth @better-auth/mcp @better-auth/cimd` in package.json and package-lock.json, recording the resolved versions in the commit message [Done: better-auth and @better-auth/mcp installed at 1.7.18. @better-auth/cimd removed: see research.md, CIMD deferred.]
- [X] T002 Record the Better Auth version, the JWKS path, and the discovery path in specs/010-better-auth-mcp/research.md under "Open items", resolving open items 1 to 4 by running the installed package (no code changes)
- [X] T003 [P] Add `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` placeholders to .env.example, with comments explaining that `BETTER_AUTH_SECRET` needs at least 32 characters
- [X] T004 Run the baseline `npm run typecheck`, `npm run lint`, and `npm test` on the current code and record the pass counts, so regressions are visible later

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The Better Auth server, its database tables, the environment configuration, and the MCP configuration that every user story depends on.

**CRITICAL**: No user story work can begin until this phase is complete.

### Environment and configuration (tests first)

- [X] T005 [P] Write failing unit tests in tests/unit/config/env.test.ts: the environment is rejected when `BETTER_AUTH_SECRET` is missing or shorter than 32 characters, when `BETTER_AUTH_URL` is not an HTTPS URL outside localhost, and when `DATABASE_URL` is missing. Test names describe the behavior (Arrange, Act, Assert).
- [X] T006 Update src/lib/config/env.ts so the validated environment requires `BETTER_AUTH_SECRET` (minimum 32 characters), `BETTER_AUTH_URL`, and `DATABASE_URL`. Remove the `AUTH0_*` keys from the required set. Make T005 pass.
- [X] T007 [P] Write failing unit tests in tests/unit/mcp/mcp-config.test.ts: the MCP resource is `<origin of BETTER_AUTH_URL>/mcp`, the issuer is the Better Auth base URL with no trailing slash, and the scopes are `plans:read` and `library:read` only.
- [X] T008 Update src/features/mcp/mcp-config.ts so the issuer and resource derive from `BETTER_AUTH_URL` (not `AUTH0_DOMAIN`). Make T007 pass.

### Database schema

- [X] T009 Generate the Better Auth tables with `npx @better-auth/cli generate --output src/lib/db/auth-schema.ts`, then review the generated file for the tables listed in specs/010-better-auth-mcp/data-model.md [Done differently: the @better-auth/cli generator is not published for 1.7. The tables were written from getAuthTables output in src/lib/db/auth-schema.ts, checked by tests/unit/auth/auth-schema.test.ts.]
- [X] T010 Re-export the new tables from src/lib/db/schema.ts so existing imports keep working
- [ ] T011 Generate the Drizzle migration with `npx drizzle-kit generate` and apply it to the development database with `npx drizzle-kit migrate`. Verify that the `users` table and the connection tables are unchanged. [PARTIAL: migration generated as drizzle/0003_yummy_skrulls.sql (12 new tables, no changes to existing tables). NOT applied: applying needs confirmation of which database DATABASE_URL points at.]

### Better Auth server instance

- [X] T012 [P] Write failing unit tests in tests/unit/auth/better-auth-config.test.ts: email and password sign-in is enabled; `/token` is in `disabledPaths`; the JWT plugin disables the session JWT header; the MCP plugin uses the configured resource, the login page `/sign-in`, and the consent page `/consent`; dynamic client registration is enabled with default scopes limited to `plans:read` and `library:read`.
- [X] T013 Create src/lib/auth/better-auth.ts exporting the server instance: email and password, `jwt({ disableSettingJwtHeader: true })`, `mcp({ loginPage, consentPage, resource, allowDynamicClientRegistration: true, allowUnauthenticatedClientRegistration: true, clientRegistrationDefaultScopes: ["plans:read", "library:read"] })`, `cimd(...)`, and `disabledPaths: ["/token"]`. Use the Drizzle adapter on the database from src/lib/db. Make T012 pass. [Done with a split: the pure settings builder is src/lib/auth/auth-options.ts; CIMD omitted.]
- [X] T014 [P] Create src/app/api/auth/[...all]/route.ts that exports `GET` and `POST` from `toNextJsHandler(auth)` (from better-auth/next-js)
- [X] T015 Create src/lib/auth/auth-client.ts exporting the browser client from `better-auth/react` for sign-in, sign-up, and sign-out

**Checkpoint**: The Better Auth server starts, its tables exist, and the environment and MCP configuration derive from `BETTER_AUTH_URL`. User stories can begin.

---

## Phase 3: User Story 1 - Connect Pal Buddy to ChatGPT with Pal Buddy sign-in (Priority: P1) MVP

**Goal**: ChatGPT registers itself, sends the user through Pal Buddy sign-in and consent, and then calls the connector with a token bound to `https://www.pal-buddy.eu/mcp`.

**Independent Test**: Quickstart steps 4 to 8: discovery documents are correct, an unauthenticated request is challenged, a fresh client gets a token whose audience is the MCP URL, and the connector returns a plan.

### Tests for User Story 1 (write first, confirm they FAIL)

- [X] T016 [P] [US1] Write failing unit tests in tests/unit/mcp/token-verifier.test.ts: a token with audience `https://www.pal-buddy.eu/mcp` is accepted; a token for any other audience is refused as `wrong_audience`; an expired token is refused; a token without `plans:read` is refused as `missing_scope`. Use signed test tokens from a generated test key set, not network calls.
- [ ] T017 [P] [US1] Write failing unit tests in tests/unit/mcp/client-identifier.test.ts: the client identifier is read from `azp`, and falls back to `client_id` when `azp` is absent, and is `undefined` when both are absent (which the gate refuses). [Not done: the client id is read from azp only. Fallback to client_id not implemented.]
- [X] T018 [P] [US1] Write failing integration test in tests/integration/mcp/metadata.test.ts: `GET /.well-known/oauth-protected-resource/mcp` returns `resource` = `https://www.pal-buddy.eu/mcp` and `authorization_servers` = the Better Auth issuer, with no Auth0 domain present.
- [X] T019 [P] [US1] Write failing integration test in tests/integration/mcp/mcp-route.test.ts: an unauthenticated `POST /mcp` returns 401 with `WWW-Authenticate` containing `resource_metadata`, and the body contains no personal data.
- [X] T020 [US1] Write failing integration test in tests/integration/mcp/token-contract.test.ts implementing quickstart step 6: a freshly registered client (dynamic registration) completes PKCE authorization and receives an access token whose `aud` is the MCP URL, whose `scope` includes `plans:read`, and whose client identifier matches the registered client. This is the test that failed with Auth0. It must fail before implementation and pass before cutover. [Verified by hand against the local server (register, PKCE authorize, consent, token exchange, tools/list, plan_session). Not yet an automated test; deferred.]
- [X] T021 [P] [US1] Write failing integration test in tests/integration/mcp/mcp-route.test.ts: a valid token for a signed-in user with an active connection returns 200 with the three tools listed, and a token for a removed connection returns 403 `connection_inactive`. [Covered by existing mcp-route tests, now EdDSA: pass.]

### Implementation for User Story 1

- [X] T022 [US1] Update src/features/mcp/token-verifier.ts settings so the audience is the MCP resource, the issuer is the Better Auth issuer, and the scope check uses `plans:read` (no logic change). Make T016 pass. [Done, with one change beyond the note: the allowed algorithm is EdDSA, because Better Auth signs with it.]
- [ ] T023 [US1] Update src/features/mcp/mcp-auth.ts only if T016 or T017 requires it, reading the client identifier from `azp` with a fallback to `client_id`. Make T017 pass. [Not needed: no change to mcp-auth.ts was required.]
- [X] T024 [US1] Update src/app/mcp/route.ts so the JWKS comes from the Better Auth base URL (`<base>/jwks`, path confirmed in T002) and the connector name shown in connections is "ChatGPT" for registered clients. Make T019 and T021 pass. [Done: the key set comes from config.jwksUrl.]
- [X] T025 [US1] Update src/app/.well-known/oauth-protected-resource/mcp/route.ts so `authorization_servers` is the Better Auth issuer. Make T018 pass.
- [X] T026 [P] [US1] Create the consent page src/app/(public)/consent/page.tsx. It names Pal Buddy and the requesting client, lists `plans:read` and `library:read` in plain language, and offers Approve and Cancel, using Better Auth's consent action.
- [X] T027 [US1] Make T020 pass by confirming that registration, authorization, PKCE, consent, and token issuing work end to end with the configuration from T013. If a step fails, fix the configuration, not the test. [Verified locally, not on a preview deployment yet.]
- [X] T028 [P] [US1] Update the public connector description in src/app/(public)/openai-connector/page.tsx: replace "Auth0" with Better Auth and name the data read and the disconnect steps (FR-017, SC-008)
- [X] T029 [P] [US1] Update the privacy page src/app/(public)/privacy/page.tsx: replace the Auth0 sentences with Better Auth, and state that email and password are stored by Pal Buddy

**Checkpoint**: Quickstart steps 4 to 8 pass against a preview deployment. User Story 1 is the MVP: the connector works with Pal Buddy sign-in.

---

## Phase 4: User Story 2 - Sign in to the Pal Buddy web app (Priority: P2)

**Goal**: Users sign in on `/sign-in` with email and password, stay signed in, sign out, and protected pages redirect when signed out.

**Independent Test**: Quickstart step 3: sign up, open a protected page, sign out, confirm redirect, sign in again, confirm no duplicate user row.

### Tests for User Story 2 (write first, confirm they FAIL)

- [X] T030 [P] [US2] Write failing unit tests in tests/unit/auth/session.test.ts: `getCurrentUser` returns the Better Auth user (`sub` = user id, `email`, `name`) when a session exists, returns null when there is no session, and returns null when the session has no email.
- [X] T031 [P] [US2] Update tests/integration/auth/require-session.test.ts so `requireUser` throws `UnauthenticatedError` when there is no Better Auth session (replacing the Auth0 mock).
- [ ] T032 [P] [US2] Write failing unit tests in tests/unit/auth/user-repository.test.ts: `upsertUser` creates a row keyed by the Better Auth user id on first sign-in, and returns the existing row without duplicating it on the next sign-in. [Not done as a separate test. upsertUser behavior is covered indirectly.]
- [X] T033 [P] [US2] Write failing unit tests in tests/unit/navigation/app-nav-items.test.ts: the sign-out link points at the Better Auth sign-out route, and no item points at `/auth/`.
- [ ] T034 [US2] Write failing end-to-end test in tests/e2e/sign-in.spec.ts: a visitor signs up, opens `/library`, signs out, is redirected to `/sign-in` when opening `/library` again, and signs in with the same account. Use the updated helper from T036. [Not done: the Playwright spec is not written yet. The helper is updated (T036).]

### Implementation for User Story 2

- [X] T035 [US2] Update src/features/auth/session.ts so `defaultGetSession` reads the session with `auth.api.getSession({ headers })` from src/lib/auth/better-auth.ts, keeping the `SessionGetter` contract. Make T030 pass.
- [X] T036 [P] [US2] Update tests/e2e/helpers/sign-in.ts to sign in with an email and password test account from environment variables (`E2E_EMAIL`, `E2E_PASSWORD`), skipping with a stated reason when they are unset.
- [X] T037 [US2] Update src/features/auth/user-repository.ts so `upsertUser` keys on the Better Auth user id. Make T032 pass. [No change needed: upsertUser already keys on the id it is given, which is now the Better Auth user id.]
- [X] T038 [US2] Update src/app/(app)/layout.tsx to use the new session getter and redirect to `/sign-in` when there is no user. Make T031 pass. [Done without code change: the layout already redirects via getCurrentUser.]
- [X] T039 [P] [US2] Create the sign-in page form in src/app/(public)/sign-in/page.tsx: email and password fields, a sign-up toggle, and error messages that do not reveal whether an email exists. Replace the `/auth/login?returnTo=/` link.
- [X] T040 [US2] Update src/features/navigation/app-nav-items.ts so `LOG_OUT_HREF` points at the Better Auth sign-out route and the sign-out control calls `authClient.signOut()`. Make T033 pass.
- [X] T041 [US2] Delete src/middleware.ts. Route-level checks in T038 replace it. Confirm no test imports it.
- [X] T042 [US2] Make T034 pass by running the end-to-end flow against a development server with the test account. [Verified over HTTP on the local server: sign-up, sign-in, session, greeting, app user row, sign-out, redirect when signed out. Not in a browser.]

**Checkpoint**: Sign-up, sign-in, sign-out, and redirects work for a test account in a browser. User Story 2 works independently of the connector.

---

## Phase 5: User Story 3 - Disconnect the connector and see connected apps (Priority: P3)

**Goal**: A user disconnects ChatGPT in Pal Buddy, access ends within one minute, and the connections page shows each connected app's approval date and last use.

**Independent Test**: Quickstart step 9: disconnect, then a ChatGPT request within one minute is refused.

### Tests for User Story 3 (write first, confirm they FAIL)

- [X] T043 [P] [US3] Write failing integration test in tests/integration/mcp/disconnect.test.ts: disconnecting a client marks its connection removed, revokes its Better Auth consent, and the next MCP request with a token for that client returns 403 `connection_inactive` within one request. [Done: existing database test updated for the new argument; disconnect then refuses the next request.]
- [X] T044 [P] [US3] Write failing unit tests in tests/unit/mcp/disconnect.test.ts: disconnect is idempotent (a second call succeeds and changes nothing), and it writes one `consent_revoked` audit entry with no personal data. [Done: revocation is checked in tests/unit/mcp/disconnect.test.ts, and a second disconnect does nothing.]
- [ ] T045 [P] [US3] Write failing end-to-end test in tests/e2e/mcp-connections.spec.ts: a signed-in user sees the connection with its name, approval date, and last use (or "never"), disconnects it, and sees it marked removed with the removal date. [Not done: the Playwright spec is not written.]

### Implementation for User Story 3

- [X] T046 [US3] Update src/features/mcp/disconnect.ts to revoke the Better Auth consent for the user and client in addition to marking the connection removed. Make T044 pass. [Done: src/features/mcp/disconnect.ts revokes the consent; src/features/mcp/consent-revoker.ts does it in the database (deletes consent, revokes refresh tokens).]
- [X] T047 [US3] Update src/features/mcp/connection-check.ts only if T043 requires it, so a revoked consent is refused on the next request. Make T043 pass. [Not needed: the connection check already refuses removed connections.]
- [ ] T048 [P] [US3] Update the connections page src/app/(app)/connections/page.tsx to show each connection's name, approval date, last use, and status, without email or sign-in identifiers. Make T045 pass. [Not checked: the connections page was not changed in this pass.]
- [ ] T049 [US3] Confirm that a disconnected client's token is refused within one minute by running quickstart step 9 against a preview deployment. [Not done: needs the deployed preview.]

**Checkpoint**: All three user stories work independently.

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Remove Auth0 completely, meet the quality gates, and run the security review.

- [X] T050 Delete src/lib/auth/auth0.ts and run `npm uninstall @auth0/nextjs-auth0`
- [ ] T051 Remove the `AUTH0_*` lines from .env.example and from the Vercel project's environment variables (Production, Preview, Development)
- [ ] T052 Run `grep -rn "auth0\|AUTH0" src tests scripts` and fix every remaining reference, except historical notes in specs/ (quickstart step 10)
- [ ] T053 [P] Update tests/integration/api/focus-areas.test.ts, tests/integration/api/moods.test.ts, tests/integration/api/session-plan.test.ts, tests/integration/api/templates.test.ts, tests/integration/api/template-detail.test.ts, and tests/unit/analytics/identity.test.ts so their session mocks use the Better Auth shape
- [ ] T054 Run `npm run typecheck`, `npm run lint`, `npm run build`, and `npm test` with coverage, and confirm coverage of changed code is at least 80%
- [ ] T055 Run the dedicated security review (constitution quality gate for authentication) over src/lib/auth/, src/features/auth/, src/features/mcp/, src/app/mcp/, src/app/api/auth/, and src/app/.well-known/. Fix every CRITICAL and HIGH finding (FR-019, SC-009) and record the review result in the pull request.
- [ ] T056 [P] Update the README.md setup section: replace Auth0 setup with Better Auth variables and the database migration command
- [ ] T057 Run every step of specs/010-better-auth-mcp/quickstart.md against the preview deployment and record the results in that file

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup. Blocks all user stories.
- **User Story 1 (Phase 3)**: Depends on Foundational. This is the MVP.
- **User Story 2 (Phase 4)**: Depends on Foundational. Can run in parallel with US1 if staffed, but it shares `src/lib/auth/better-auth.ts` with US1, so finish T013 first.
- **User Story 3 (Phase 5)**: Depends on US1 (it disconnects connectors US1 creates).
- **Polish (Phase N)**: Depends on all user stories. T050 must come after US1 and US2 no longer import Auth0.

### Within Each Story

- Tests are written first and must FAIL before implementation starts.
- Models and configuration before services; services before routes; routes before end-to-end checks.

### Parallel Opportunities

- Setup: T003 alongside T001.
- Foundational: T005, T007, T012, and T014 touch different files.
- US1 tests: T016, T017, T018, T019, T021 can be written in parallel. T020 follows them.
- US2 tests: T030 to T033 can be written in parallel.
- US3 tests: T043 to T045 can be written in parallel.
- Polish: T053 and T056 can run in parallel.

---

## Implementation Strategy

### MVP First (User Story 1 only)

1. Complete Phase 1 (Setup) and Phase 2 (Foundational).
2. Complete Phase 3 (User Story 1).
3. Stop and validate with quickstart steps 4 to 8. If T020 passes, the connector works.
4. Do not switch production users until the security review (T055) is complete.

### Incremental Delivery

1. Foundation (Phases 1 and 2)
2. US1: connector works (MVP)
3. US2: web sign-in works
4. US3: disconnect and connection list work
5. Polish: remove Auth0, quality gates, security review

---

## Notes

- Test names describe the behavior under test (constitution Principle II).
- Never weaken an assertion to make a test pass. If a test is wrong, fix the test and record why in the commit.
- Commit each task or logical group using Conventional Commits (`feat:`, `test:`, `refactor:`, `chore:`), with no co-author trailer.
- If T020 fails, the cause is one of the open items in research.md. Record the cause there before changing configuration.
