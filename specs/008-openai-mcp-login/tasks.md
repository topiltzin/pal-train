# Tasks: OpenAI MCP Sign-In for Paltrain

**Input**: Design documents from `/specs/008-openai-mcp-login/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/, quickstart.md

**Tests**: Included. The constitution (Principle II) requires test-first development, so each story writes its failing tests before its implementation.

**Organization**: Tasks are grouped by user story (US1 connect and sign in, US2 tools, US3 disconnect). US1 is blocked by the consent spike (T014). US2 and US3 depend on US1's route and connection code.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: US1, US2, or US3 (setup, foundational, and polish tasks have no story label)
- Exact file paths in every description

## Path Conventions

- Feature logic: `src/features/mcp/`
- Routes and pages: `src/app/mcp/`, `src/app/.well-known/`, `src/app/(app)/connections/`
- Unit tests: `tests/unit/mcp/`; integration tests: `tests/integration/mcp/`; end-to-end: `tests/e2e/`
- Migrations: `drizzle/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Pin the two new dependencies and record the Auth0 tenant answers that later tasks depend on.

- [X] T001 Install and pin `@modelcontextprotocol/server` and `jose` in `package.json` and `package-lock.json`, using the versions that match the SDK authorization docs (plan Technical Context, research §10 and §11). Record both exact versions in `specs/008-openai-mcp-login/quickstart.md`.
- [X] T002 Record the Auth0 tenant answers in `specs/008-openai-mcp-login/research.md`: whether Client ID Metadata Documents or Dynamic Client Registration is available (research §2), and whether the tenant emits RFC 9207 `iss` (research §3). Update the open-items list in the same file.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Storage, configuration, rate limiting, audit, and the connection check. Every user story depends on these.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T003 Write failing unit tests in `tests/unit/mcp/mcp-config.test.ts`: the resource identifier is `<APP_BASE_URL>/mcp` (no trailing slash); the issuer is `https://<AUTH0_DOMAIN>/`; the read-only scope list contains only `plans:read` and `library:read`; a missing `APP_BASE_URL` throws an error naming the variable.
- [X] T004 Implement `src/features/mcp/mcp-config.ts` so T003 passes. It reads the existing validated environment from `src/lib/config/env.ts` and returns a new object. It has no secrets.
- [X] T005 [P] Write failing unit tests in `tests/unit/mcp/rate-limit.test.ts`: a window starts at the minute, truncated (`window_start` has seconds and milliseconds set to zero); the 60th request in a window is accepted and the 61st is refused with a retry time; a new minute resets the count; the limit value is a named constant of 60.
- [X] T006 Implement `src/features/mcp/rate-limit.ts` with the fixed limit constant `MCP_REQUESTS_PER_MINUTE = 60` so T005 passes. Quote the data model rule in the code comment: "a request is refused with a retry message when `request_count` has reached the fixed per-minute limit".
- [X] T007 [P] Write failing unit tests in `tests/unit/mcp/audit-log.test.ts`: each event kind (`consent_granted`, `consent_denied`, `token_accepted`, `token_refused`, `connection_refused`, `disconnected`, `rate_limited`) is accepted; an unknown event kind is rejected; `reason_code` is a short code and the writer rejects any value longer than 64 characters; the writer never receives or stores an email, display name, token, or mood value (assert the stored fields are exactly `created_at`, `event`, `user_id`, `client_id`, `reason_code`).
- [X] T008 Implement `src/features/mcp/audit-log.ts` so T007 passes. Data model rule: "the table must never receive a token, an authorization code, an email address, a display name, or a mood value".
- [X] T009 Add three tables to `src/lib/db/schema.ts` per `data-model.md`: `mcp_connections`, `mcp_audit_entries`, `mcp_rate_windows`. Quote the constraints in code comments: `client_id` "At most 255 characters"; `client_name` "At most 100 characters"; `status` is `active` or `removed`; `granted_scopes` must be a subset of the allowed read-only list; unique on (`user_id`, `client_id`); `mcp_rate_windows` primary key (`user_id`, `window_start`); `user_id` references `users.id` with cascade delete.
- [X] T010 Generate the migration with `npm run db:generate` into `drizzle/`, then apply it to the development database with `npm run db:migrate`. Review the generated SQL for the constraints from T009 before applying.
- [X] T011 Write failing unit tests in `tests/unit/mcp/connection-check.test.ts`: a connection with status `active` passes; `removed` is refused with reason `removed`; no connection row is refused with reason `missing`; a connection owned by another user is refused.
- [X] T012 Implement `src/features/mcp/connection-repository.ts`: an interface (find by user and client, create or reactivate on approval, mark removed, update `last_used_at`) plus a Drizzle implementation. Tools and routes depend on the interface, not on Drizzle directly.
- [X] T013 Implement `src/features/mcp/connection-check.ts` so T011 passes, using the repository interface from T012.
- [X] T014 **Spike (blocks User Story 1)**: confirm in the Auth0 tenant whether the consent screen can show Paltrain's name, OpenAI's name, and the data shared (spec FR-003). If it cannot, choose the Paltrain interstitial fallback (research §7). Record the outcome and the choice in `specs/008-openai-mcp-login/research.md` §7 and in `contracts/http-endpoints.md` (section "Consent entry point"). Do not start T021 until this is recorded.

**Checkpoint**: Storage, configuration, rate limiting, audit, and the connection check are tested. User stories may begin once T014 is recorded.

---

## Phase 3: User Story 1 - Connect a Paltrain account from OpenAI (Priority: P1) 🎯 MVP

**Goal**: A user adds Paltrain in ChatGPT, signs in with their Paltrain account, approves consent, and sees the connector as connected. Requests without a valid token are refused (spec US1, FR-001 to FR-003, FR-006, FR-007, FR-010, FR-015).

**Independent Test**: Request `/mcp` with no token and get `401` with a `WWW-Authenticate` header pointing at the metadata URL. Request the metadata URL and get the contract JSON. Complete the connector sign-in from ChatGPT and see a `mcp_connections` row with status `active` and a `consent_granted` audit entry.

### Tests for User Story 1 ⚠️

> **NOTE: Write these tests FIRST and confirm they FAIL before implementation**

- [X] T015 [P] [US1] Write failing unit tests in `tests/unit/mcp/token-verifier.test.ts` using a locally generated RSA key and a fake JWKS: a correctly signed token with the right issuer, audience, expiry, and scope is accepted; a token with a wrong signature is refused; `alg: none` is refused; a wrong issuer is refused; a wrong audience (not `<APP_BASE_URL>/mcp`) is refused; an expired token is refused; a token missing `plans:read` is refused with `insufficient_scope`. The verifier returns `expiresAt` and `resource` (per the SDK pattern in research §5).
- [X] T016 [P] [US1] Write failing integration tests in `tests/integration/mcp/mcp-route.test.ts` for the status table in `contracts/http-endpoints.md`: no token gives `401` with `WWW-Authenticate` naming `resource_metadata`; an invalid token gives `401` with `error="invalid_token"`; a token missing the scope gives `403` with `error="insufficient_scope"`. These run against the real route handler with signed test tokens and no network call to Auth0.
- [X] T017 [P] [US1] Write failing integration tests in `tests/integration/mcp/metadata.test.ts`: `GET /.well-known/oauth-protected-resource/mcp` returns JSON with `resource` equal to `<origin>/mcp`, `authorization_servers` equal to `["https://<AUTH0_DOMAIN>/"]`, `scopes_supported` listing exactly the two read-only scopes, and `bearer_methods_supported` equal to `["header"]`, with `Content-Type: application/json` and no secret values.

### Implementation for User Story 1

- [X] T018 [US1] Implement `src/features/mcp/token-verifier.ts` so T015 passes, using `jose` with a remote JWKS from `https://<AUTH0_DOMAIN>/.well-known/jwks.json`. It maps the verified payload to the `AuthInfo` shape the SDK expects, and it never logs the token.
- [X] T019 [US1] Create `src/app/.well-known/oauth-protected-resource/mcp/route.ts` so T017 passes. It returns the RFC 9728 metadata built from `mcp-config.ts`.
- [X] T020 [US1] Create `src/app/mcp/route.ts` with the SDK's bearer gate (`requireBearerAuth` from `@modelcontextprotocol/server`) using the verifier from T018 and the `resource_metadata` URL from T019. Make T016 pass for the `401` and `403` rows. The MCP handler itself comes in T029.
- [X] T021 [US1] Implement the consent step chosen in T014 in `src/features/mcp/connect.ts`. On the first accepted approval, call the repository (T012) to create the connection as `active` with `approved_at` set, and write a `consent_granted` audit entry (T008). If the Paltrain interstitial was chosen, add its page at `src/app/(public)/connect/page.tsx` showing Paltrain's name, OpenAI's name, and the shared data kinds, with Approve and Cancel. A cancel writes `consent_denied` and creates no connection.
- [X] T022 [US1] Wire the bearer gate to write `token_refused` audit entries with a reason code (`expired`, `wrong_audience`, `missing_scope`) for each refusal in `src/app/mcp/route.ts`, and `token_accepted` for each accepted request, with `last_used_at` updated through the repository.
- [X] T023 [US1] Run `tests/unit/mcp/` and `tests/integration/mcp/` until T015 to T017 pass, and confirm each test was red before its implementation.

**Checkpoint**: User Story 1 is functional. The connector can be reached, refuses bad tokens, publishes metadata, and records a connection on approval. This is the MVP increment once US2 tools are in place.

---

## Phase 4: User Story 2 - Ask Paltrain for a workout from the chat (Priority: P2)

**Goal**: A connected user asks for focus areas, exercises, and session plans through the three read-only tools, and gets the same results as the app (spec US2, FR-004, FR-011, FR-012, FR-013).

**Independent Test**: With an active connection, call `plan_session` with `mood`, `focus`, and `minutes` and confirm the exercises match the app's `planSession` output for the same inputs. Make 61 requests in one minute and confirm the 61st returns `429` with `Retry-After`.

### Tests for User Story 2 ⚠️

- [X] T024 [P] [US2] Write failing unit tests in `tests/unit/mcp/tools.test.ts` for each rule in `contracts/mcp-tools.md`: `list_focus_areas` takes no input and returns `id` and `label`; `list_exercises` rejects an unknown focus with `invalid_focus` and lists the valid ids; `plan_session` rejects an unknown mood with `invalid_mood`, a focus that does not exist with `invalid_focus`, and `minutes` outside 10 to 90 or not a multiple of 5 with `invalid_minutes` stating the range and step; an unavailable library returns `unavailable` with the exact message from the contract; no output contains an email, sign-in identifier, or token.
- [X] T025 [P] [US2] Write failing integration tests in `tests/integration/mcp/plan-parity.test.ts`: for 30 combinations of mood, focus, and length, the `plan_session` tool returns the same exercise ids in the same order as calling `planSession` directly with the same inputs and the same random seed (spec SC-005).
- [ ] T026 [P] [US2] Write failing integration tests in `tests/integration/mcp/rate-limit-route.test.ts`: the 61st request in one minute is refused with `429`, a `Retry-After` header, and a `rate_limited` audit entry; the next minute accepts requests again.

### Implementation for User Story 2

- [X] T027 [US2] Move the medical notice text currently in `src/components/medical-notice.tsx` into `src/features/sessions/medical-notice-text.ts` as an exported constant, and update the component to import it. Keep the component's rendered output unchanged. Add a unit test in `tests/unit/sessions/medical-notice-text.test.ts` that the constant is non-empty and matches the text the component shows.
- [X] T028 [US2] Implement `src/features/mcp/tools.ts` so T024 passes: `list_focus_areas` from `src/features/library/focus-areas.ts`; `list_exercises` from the exercise library (`src/features/sessions/exercise-library.ts`); `plan_session` calling `planSession` from `src/features/sessions/plan-session.ts` with the same inputs the app's session-plan route uses, and returning the `medicalNotice` constant from T027. Each tool validates its input with `zod` before use.
- [X] T029 [US2] Implement `src/features/mcp/server.ts` that builds the MCP server and registers the three tools from T028 with their `zod` input schemas, and wire `src/app/mcp/route.ts` (from T020) to pass requests to it through the SDK's Streamable HTTP handler, after the bearer gate and the connection check (T013).
- [X] T030 [US2] Wire the rate limiter (T006) into `src/app/mcp/route.ts` after the connection check: count the request for the user's window, and refuse with `429` and a `Retry-After` header when over the limit, writing the `rate_limited` audit entry (T008).
- [X] T031 [US2] Run `tests/unit/mcp/tools.test.ts`, `tests/integration/mcp/plan-parity.test.ts`, and `tests/integration/mcp/rate-limit-route.test.ts` until they pass, and confirm each was red first.

**Checkpoint**: User Stories 1 and 2 work together. A connected user can ask for workouts, results match the app, and excess requests are refused.

---

## Phase 5: User Story 3 - Disconnect and see what is shared (Priority: P3)

**Goal**: A user sees their connected apps with approval and last-use dates, can disconnect one, and the next request from it is refused (spec US3, FR-008, FR-009, SC-004).

**Independent Test**: Sign in to Paltrain, open `/connections`, disconnect the OpenAI connection, and confirm the next MCP request returns `403` with `connection_inactive` within one minute.

### Tests for User Story 3 ⚠️

- [X] T032 [P] [US3] Write failing unit tests in `tests/unit/mcp/disconnect.test.ts`: disconnecting an active connection sets `status` to `removed` and `removed_at` to now; disconnecting an already removed connection is a no-op with the same success result; a connection id owned by another user returns "not found" and changes nothing; the function writes a `disconnected` audit entry once.
- [X] T033 [P] [US3] Write failing integration tests in `tests/integration/mcp/disconnect.test.ts`: after disconnect, a valid token's next MCP request returns `403` with `connection_inactive` and no personal data; reconnecting through consent sets the connection back to `active` with a new `approved_at` and creates no second row.
- [ ] T034 [P] [US3] Write failing end-to-end tests in `tests/e2e/mcp-connections.spec.ts`: a signed-in user sees `/connections` listing the connection with name, approval date, and last-use value (or "never"); Disconnect marks it removed and shows the removal date; a signed-out visitor is redirected to sign-in. Use `tests/e2e/helpers/sign-in.ts` and skip with the helper's reason when test credentials are not set.

### Implementation for User Story 3

- [X] T035 [US3] Implement `src/features/mcp/disconnect.ts` so T032 passes, using the repository (T012) and the audit writer (T008). It only acts on connections owned by the signed-in user.
- [X] T036 [US3] Create the disconnect server action at `src/app/(app)/connections/actions.ts`, requiring a Paltrain session (the app's existing `requireUser`), calling `disconnect.ts`, and returning the same success result whether the connection was active or already removed.
- [X] T037 [US3] Create `src/app/(app)/connections/page.tsx`: lists the user's connections with `client_name`, `approved_at`, `last_used_at` (or "never"), and status. Only active connections show a Disconnect control. Removed connections show their removal date.
- [X] T038 [US3] Add a "Connected apps" link for `/connections` to the header menu in `src/features/navigation/app-nav-items.ts`, next to the existing "Log out" item, with a test in `tests/unit/navigation/app-nav-items.test.ts` that the link is present for a signed-in user.
- [ ] T039 [US3] Run `tests/unit/mcp/disconnect.test.ts`, `tests/integration/mcp/disconnect.test.ts`, and `tests/e2e/mcp-connections.spec.ts` until they pass, and confirm each was red first.

**Checkpoint**: All three user stories work independently and together.

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Connector review requirements, quality gates, security, and the manual checks in `quickstart.md`

- [ ] T040 Create the public connector description page at `src/app/(public)/openai-connector/page.tsx` (spec FR-014): what the connector does, which data it reads (display name, plans, library content), what it does not read (email, sign-in identifier, mood history), and how to disconnect (link to `/connections`). Add a unit test in `tests/unit/mcp/connector-description.test.ts` that the page text names each of those items.
- [X] T041 [P] Run `npm run test:coverage` and confirm coverage of `src/features/mcp/` is at least 80% (constitution Principle II).
- [ ] T042 [P] Run `npm run typecheck`, `npm run lint`, and `npm run build`; all must pass, and `/mcp` and the metadata route must appear in the build output.
- [X] T043 Check the logs and audit writes: search `src/features/mcp/` and `src/app/mcp/` for any `console.` call or any write of the `Authorization` header, a token, or an authorization code, expecting zero matches (spec FR-010, FR-015).
- [X] T044 Check the built output for secrets: after `npm run build`, search `.next/static` for `AUTH0_CLIENT_SECRET` and `DATABASE_URL` values, expecting zero matches, and confirm no client component imports `src/features/mcp/` server modules.
- [ ] T045 Run the dedicated security review (constitution quality gate for authentication and external integrations) over `src/features/mcp/`, `src/app/mcp/`, `src/app/.well-known/`, and `src/app/(app)/connections/`. Resolve every CRITICAL and HIGH finding before merge and record the result in the pull request description.
- [ ] T046 Run the manual checks in `specs/008-openai-mcp-login/quickstart.md` sections 4 and 5 against a preview deployment, using a ChatGPT connector, and record the results in that file.
- [ ] T047 Commit in Conventional Commits form (`feat: ...`, for example `feat: add openai mcp sign-in`), with no co-author trailer, and split into one commit per phase where practical. Commit only when the user asks.

---

## Dependencies & Execution Order

### Phase dependencies

- **Setup (Phase 1)**: no dependencies. T002 depends on the Auth0 tenant answers, which need the Auth0 dashboard.
- **Foundational (Phase 2)**: depends on Setup. Blocks all stories. T014 (the consent spike) blocks User Story 1.
- **User Stories (Phases 3 to 5)**: depend on Foundational. They run in order US1, US2, US3, because they share `src/app/mcp/route.ts` and `src/features/mcp/`.
- **Polish (Phase N)**: depends on the stories it checks.

### Story dependencies

- **US1 (P1)**: needs Foundational and the consent spike T014. It is the MVP.
- **US2 (P2)**: needs US1's route (T020) and the connection check (T013).
- **US3 (P3)**: needs US1's connection record (T021) and the repository (T012). It is independent of US2 in code.

### Within each story

Tests first and failing, then implementation, then the story's test run goes green.

### Parallel opportunities

- Phase 2: T005 and T007 (different test files); T003 and T011 once the repository interface (T012) exists.
- US1: T015, T016, T017 (three test files).
- US2: T024, T025, T026 (three test files).
- US3: T032, T033, T034 (three test files).
- Polish: T041 and T042.

---

## Implementation Strategy

### MVP first

Deliver Phase 1, Phase 2, and Phase 3 (US1) first. That gives a connector that signs users in and refuses bad tokens. It is not useful to ChatGPT until US2 adds tools, so the MVP for users is Phases 1 to 4.

### Incremental delivery

1. US1: sign-in, consent, and connection records, verified end to end with ChatGPT
2. US2: the three read-only tools and the rate limit
3. US3: the connections page and disconnect, shipped last and after the security review

### Spec gaps (not tasked)

Nothing new. The connector's scope is read-only (spec Assumptions), so writes, mood history, and analytics on the connector stay out of these tasks.
