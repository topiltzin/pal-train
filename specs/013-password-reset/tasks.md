# Tasks: Password Reset for Users

**Input**: Design documents from `/specs/013-password-reset/`

**Prerequisites**: [plan.md](plan.md) (required), [spec.md](spec.md) (required), [research.md](research.md), [data-model.md](data-model.md), [contracts/password-reset-interfaces.md](contracts/password-reset-interfaces.md), [quickstart.md](quickstart.md)

**Tests**: Included. Constitution Principle II makes test-first development mandatory, and the plan commits to it.

**Organization**: Grouped by user story so each story can be built and tested on its own.

## Assumptions made without an answer

The plan asked two questions that the user has not answered. These tasks use the plan's recommended defaults. Change them here before implementation if the answers differ.

- **Decision 4 (default: same response at the limit).** A refused request returns the same confirmation as an accepted one and sends no email. Tasks T033 and T036 implement this. The spec's User Story 3 wording ("try again later") is not used.
- **Decision 5 (default: switch to the WebSocket driver).** The shared database client moves to the Neon WebSocket pool so `transaction: true` works. Tasks T004 and T005 implement this. If the answer is no, drop T004 and T005, and the atomic-reset check in T018 changes to document the weaker behavior.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an unfinished task)
- **[Story]**: The user story the task serves (US1, US2, US3)
- Every description names the exact file path

## Constraints quoted from data-model.md and the spec

- Reset token lifetime: 3600 seconds (`resetPasswordTokenExpiresIn`), spec FR-005.
- Accepted requests per account: at most 5 in any rolling 60-minute window, spec FR-010. Table `password_reset_request` has fields `id`, `user_id` (references `user.id`, on delete cascade), `requested_at` (timestamp with time zone, required, default now()).
- Password length: the same rules as sign-up, spec FR-007. Better Auth defaults: minimum 8, maximum 128 (confirm against sign-up before implementation).
- Email body: the link, the 60-minute and single-use statement, and "ignore if not you". It never contains the password, stored details, or the account id, spec FR-012.
- Logs: never a plain-text email, spec FR-013. Use a truncated SHA-256 of the email.

---

## Phase 1: Setup

**Purpose**: Establish a baseline before changes.

- [X] T001 Run `npm run typecheck`, `npm run lint`, and `npm test` on the untouched tree (`package.json`) and record the results. Note that `tests/integration/api/suggestions-next.test.ts` runs against the live database and is known to be flaky.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Environment, the database client, the new table, and the shared helpers. No story starts until this is done.

**CRITICAL**: No user story work can begin until this phase is complete.

- [X] T002 [P] Write failing unit tests in `tests/unit/config/env.test.ts`: `RESEND_API_KEY` and `PASSWORD_RESET_FROM` are required; a missing value throws an error that names it; a valid pair parses
- [X] T003 Update `src/lib/config/env.ts` to add `RESEND_API_KEY` (non-empty string) and `PASSWORD_RESET_FROM` (valid email address) to `envSchema`; make T002 pass
- [X] T004 [P] Write failing integration test in `tests/integration/auth/database-transactions.test.ts`: a transaction that writes a row and then throws leaves no row behind; a committed transaction keeps its row. Uses a temporary row in the `password_reset_request` table and removes it afterwards.
- [X] T005 Change `src/lib/db/client.ts` from `drizzle-orm/neon-http` to the Neon WebSocket pool (`@neondatabase/serverless` Pool with `drizzle-orm/neon-serverless`), keeping the same `DATABASE_URL` and the `getDb()` export. Make T004 pass. Then run `tests/integration/demos` and `tests/integration/api/session-plan.test.ts` to confirm nothing else changed.
- [X] T006 Add the `password_reset_request` table to `src/lib/db/schema.ts` with the fields from data-model.md and an index on `(user_id, requested_at)`
- [X] T007 Generate the migration with `npm run db:generate` (writes under `drizzle/`). Review the generated SQL: it must only create the table and index.
- [ ] T008 Apply the migration to the development database with `npm run db:migrate`. **Ask the user to confirm before running this against any shared database.**
- [X] T009 [P] Write failing unit tests in `tests/unit/auth/password-reset-limit.test.ts`: 0 to 4 rows in the last 60 minutes allow a request; 5 rows refuse it; rows older than 60 minutes do not count; the window is rolling, not reset on the hour
- [X] T010 Create `src/features/auth/password-reset-limit.ts` exporting `RESET_LIMIT_PER_HOUR = 5`, `RESET_WINDOW_MINUTES = 60`, and `decideResetRequest(requestTimes, now)` returning `"accept"` or `"refuse"`; make T009 pass
- [X] T011 [P] Write failing unit tests in `tests/unit/auth/password-reset-email.test.ts`: the body contains the reset link and the 60-minute expiry; the body does not contain the password field name, the account id, or the user's name; the subject is "Reset your Pal Buddy password"
- [X] T012 Create `src/features/auth/password-reset-email.ts` exporting a pure `buildPasswordResetEmail({ url })` that returns `{ subject, text, html }`; make T011 pass
- [X] T013 Create `src/features/auth/password-reset-sender.ts` with a `PasswordResetSender` interface (`send({ to, subject, text, html, from })`) and a Resend implementation that takes the API key from `env.ts`; write its unit test first in `tests/unit/auth/password-reset-sender.test.ts` using a fake HTTP client
- [X] T014 [P] Write failing unit test in `tests/unit/auth/password-reset-log.test.ts`: the logged output contains the account id and a 16-character truncated SHA-256 of the email, and never the email itself
- [X] T015 Create `src/features/auth/password-reset-log.ts` exporting `logResetEvent(event, { userId, email })`; make T014 pass
- [ ] T016 Create `src/features/auth/password-reset-requests.ts`: `countRecentRequests(userId, now)`, `recordRequest(userId, now)`, and `deleteResetTokens(userId)` (deletes `verification` rows whose identifier starts with `reset-password:` and whose value is the user id). Write an integration test first in `tests/integration/auth/password-reset-requests.test.ts` that uses a temporary user.

**Checkpoint**: Environment, database client, table, and pure rules are tested and in place.

---

## Phase 3: User Story 1 - Reset a forgotten password (Priority: P1) MVP

**Goal**: A person requests a reset from the sign-in page, receives an email, sets a new password, and signs in with it.

**Independent Test**: Request a reset for a test account, open the link from the email, set a new password, and sign in with it. The old password is refused (quickstart.md steps 2 to 6).

### Tests for User Story 1 (write first, confirm they fail)

- [X] T017 [US1] Write failing unit tests in `tests/unit/auth/better-auth-config.test.ts` (extend the existing file): `emailAndPassword.resetPasswordTokenExpiresIn` is 3600; `revokeSessionsOnPasswordReset` is `true`; `sendResetPassword` is a function; the Drizzle adapter is configured with `transaction: true`; `rateLimit.storage` is `"database"`
- [ ] T018 [US1] Write failing integration test in `tests/integration/auth/password-reset-flow.test.ts`: request a reset for a temporary account with a fake sender; the fake sender receives one email with a link; reset with the token; the old password is refused and the new one signs in. Uses the same temporary-user pattern as T016. Also asserts the password is unchanged when the save fails (depends on T005; with the default decision this is the atomic-reset check).
- [ ] T019 [P] [US1] Write failing Playwright scenario in `tests/e2e/password-reset.spec.ts`: from `/sign-in`, "Forgot password?" opens `/forgot-password`; submitting an address shows the generic confirmation. Skips with the helper's reason when no test credentials are set. Uses the same `signIn` helper pattern as `tests/e2e/exercise-swap.spec.ts`.

### Implementation for User Story 1

- [X] T020 [US1] Update `src/lib/auth/auth-options.ts`: inside `emailAndPassword`, set `resetPasswordTokenExpiresIn: RESET_TOKEN_SECONDS` (3600), `revokeSessionsOnPasswordReset: true`, and a `sendResetPassword` supplied through the settings object; add `rateLimit: { enabled: true, storage: "database" }`. Make T017 pass.
- [X] T021 [US1] Update `src/lib/auth/better-auth.ts`: pass the sender from `password-reset-sender.ts` and the transaction flag on the Drizzle adapter; inside `sendResetPassword`, call the sender through `waitUntil` from `@vercel/functions` so the response does not wait for the email; log the request with `logResetEvent` (T015). Make T018 pass.
- [X] T022 [P] [US1] Create `src/features/auth/forgot-password-form.tsx`: an email field with a label above it, a submit button, and the generic confirmation "If an account exists for that address, we've sent a link to reset the password." It calls `authClient.requestPasswordReset({ email, redirectTo: origin + "/reset-password" })`, shows the same confirmation whatever the outcome, and announces errors in a live region.
- [X] T023 [P] [US1] Create `src/app/(public)/forgot-password/page.tsx` that renders the form from T022 with the layout of `src/app/(public)/sign-in/page.tsx`
- [X] T024 [P] [US1] Create `src/features/auth/reset-password-form.tsx`: reads `token` from the URL; a new-password field with show/hide (reuse the control from `src/features/auth/sign-in-form.tsx`); calls `authClient.resetPassword({ newPassword, token })`; on success shows "Your password has been changed. Sign in with your new password." with a link to `/sign-in`
- [X] T025 [P] [US1] Create `src/app/(public)/reset-password/page.tsx` that renders the form from T024
- [X] T026 [US1] Update `src/features/auth/sign-in-form.tsx` to add a "Forgot password?" link to `/forgot-password` below the password field
- [ ] T027 [US1] Run `tests/unit/auth` and `tests/integration/auth/password-reset-flow.test.ts`, and the e2e scenario from T019 (with credentials set), until they pass

**Checkpoint**: User Story 1 works on its own. The MVP can be demonstrated.

---

## Phase 4: User Story 2 - Handle an expired or used link (Priority: P2)

**Goal**: A new request makes older links stop working. Expired, used, or altered links show a clear message instead of an error page.

**Independent Test**: Use a link twice, use one after it expires, and request two links and open the first (quickstart.md step 3).

### Tests for User Story 2 (write first, confirm they fail)

- [ ] T028 [P] [US2] Add failing cases to `tests/integration/auth/password-reset-flow.test.ts`: after a second request, the first token is refused and the second works; a used token is refused on a second use; a token past its time limit is refused
- [ ] T029 [P] [US2] Add failing e2e scenario to `tests/e2e/password-reset.spec.ts`: opening `/reset-password?error=INVALID_TOKEN` shows "This link is no longer valid." with a link to `/forgot-password`, and no error page

### Implementation for User Story 2

- [ ] T030 [US2] In `src/lib/auth/auth-options.ts`, add a before-hook on `/request-password-reset` that calls `deleteResetTokens(userId)` for the account before Better Auth creates a new token (research Decision 2). Look up the account by the email in the request body; do nothing when no account exists. Make T028 pass.
- [X] T031 [US2] Update `src/app/(public)/reset-password/page.tsx` to read the `error` query parameter: when it equals `INVALID_TOKEN`, show the message from T029 and the link instead of the form
- [ ] T032 [US2] Run the T028 and T029 cases until they pass

**Checkpoint**: User Stories 1 and 2 both work independently.

---

## Phase 5: User Story 3 - Protect accounts from misuse of reset (Priority: P3)

**Goal**: Address-enumeration protection, a per-account limit, session revocation after a reset, and a privacy-safe log.

**Independent Test**: Request resets for an address with and without an account and compare the responses. Make six requests in an hour and confirm the sixth sends no email. Reset a password while signed in on a second device and confirm that device is signed out (quickstart.md step 3).

### Tests for User Story 3 (write first, confirm they fail)

- [ ] T033 [P] [US3] Write failing integration test in `tests/integration/auth/password-reset-limit.test.ts`: the same response body and status for an address with and without an account; the sixth request for one account inside 60 minutes sends no email and returns the same body; a request after the window is accepted
- [ ] T034 [P] [US3] Write failing integration test in `tests/integration/auth/password-reset-sessions.test.ts`: a session created before the reset is invalid after a successful reset; a session created after is not affected
- [ ] T035 [P] [US3] Extend `tests/unit/auth/password-reset-log.test.ts` (failing first): the events `password reset requested`, `password reset completed`, and `password reset refused` are each logged with the account id and the hashed email, never the address

### Implementation for User Story 3

- [ ] T036 [US3] In `src/lib/auth/auth-options.ts`, extend the before-hook from T030: count the account's accepted requests with `countRecentRequests`; when `decideResetRequest` returns `"refuse"`, return the generic success response without calling Better Auth and without recording a row (Decision 4); when it returns `"accept"`, call `recordRequest`. Make T033 pass.
- [ ] T037 [US3] Confirm that `revokeSessionsOnPasswordReset` from T020 revokes other sessions. If T034 fails, add the session revocation explicitly and document why in the file.
- [ ] T038 [US3] Wire `logResetEvent` for the three events in `src/lib/auth/better-auth.ts` and the before-hook, so every path logs exactly one event. Make T035 pass.
- [ ] T039 [US3] Run T033 to T035 until they pass

**Checkpoint**: All three stories work independently.

---

## Final Phase: Polish & Cross-Cutting Concerns

**Purpose**: Quality gates, the database change check, and manual checks.

- [ ] T040 [P] Run `npm run typecheck`, `npm run lint`, and `npm run test:coverage`; confirm changed `src/**/*.ts` files are at or above 80% coverage (`vitest.config.ts`)
- [ ] T041 [P] Check Principle I in changed files: functions under 50 lines, nesting at most 4 levels, no `console.log`, no secrets in code (`src/lib/config/env.ts` reads them)
- [ ] T042 Re-run the database-using tests (`tests/integration/demos`, `tests/integration/api/session-plan.test.ts`, `tests/integration/auth`) after the client change in T005. The known flaky `suggestions-next.test.ts` is excluded and noted.
- [ ] T043 Run the manual checks in quickstart.md steps 2 to 5: the happy path, the failure cases, phone-width layout, and keyboard-only operation
- [ ] T044 Security review (required by constitution): run the security-reviewer agent over the auth changes (`src/lib/auth/`, `src/features/auth/`, the new pages, the migration). Fix any CRITICAL or HIGH finding before merge.
- [ ] T045 Provision the email provider with the Vercel Marketplace (`vercel integration add resend`) and set `PASSWORD_RESET_FROM` for each environment. **Ask the user to confirm before provisioning.** Record the outcome in quickstart.md troubleshooting.

---

## Dependencies & Execution Order

### Phase dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup. Blocks all user stories. T005 (client change) and T008 (migration) gate the integration tests.
- **User stories (Phases 3 to 5)**: All depend on Foundational. US1 is the MVP. US2 changes the before-hook from US1's configuration (T030 after T020). US3 extends the same hook (T036 after T030).
- **Polish (Final)**: Depends on the stories being complete. T044 (security review) comes last, before merge.

### Within each story

- Tests first (confirm they fail), then implementation, then the end-to-end check.
- Pure rules (T010, T012, T015) before the Better Auth configuration (T020, T021) and the hooks (T030, T036).

### Parallel opportunities

- Phase 2: T002, T004, T009, T011, T014 can be written in parallel.
- Phase 3: T022, T023, T024, T025 touch different files and can run in parallel after T020 and T021.
- Phase 4 and 5: the new tests (T028, T029, T033, T034, T035) can be written in parallel.

---

## Notes

- Commit after each task or small group, using Conventional Commits (`feat`, `test`, `refactor`), per the constitution. Nothing is committed without the user's go-ahead.
- The e2e file skips without `E2E_USER_EMAIL` and `E2E_USER_PASSWORD`. Reading the reset link in an end-to-end test needs a test sender; T019 assumes one is added alongside the sender in T013. If that is not wanted, the full reset path is covered by the integration test T018 only.
- Tasks T008 and T045 change external state (the database and the marketplace) and need the user's confirmation before running.

---

## Implementation notes (added during /speckit-implement)

- **T008 is not done.** Migrations `drizzle/0004_clammy_shape.sql` (password_reset_request) and `drizzle/0005_large_firedrake.sql` (rate_limit) are generated but not applied. Applying them needs the user's confirmation. Until then the database tests for the new table (T016 in `tests/integration/auth/password-reset-requests.test.ts`, and everything listed as DB-dependent below) fail with "relation does not exist".
- **T030 and T036 replaced.** The request logic lives in `src/features/auth/password-reset-flow.ts`, run from `sendResetPassword`, not in a before-hook. Better Auth creates the token before calling it, so the limit can delete the refused request's own token and keep older links; the response is the same endpoint response either way. Tests: `tests/unit/auth/password-reset-flow.test.ts`.
- **T013 and T021 use `fetch` and `after`.** `@vercel/functions` is not installed, and the plan's assumption that it was "existing" was wrong. Delivery uses `after` from `next/server`, which needs no new dependency.
- **T038 partly done.** "password reset requested" and "password reset refused" are logged by the flow. "password reset completed" is logged by Better Auth's `onPasswordReset` hook.
- **T018, T019, T028, T029, T033, T034, T032, T027 (integration and e2e parts) not written or run.** The integration tests need the migration; the e2e tests need test credentials and a test sender.
- **T045 not done.** The Resend key in `.env.local` is the placeholder `re_local_placeholder`, so no real email is sent locally.
- **Decisions 4 and 5 (plan) applied as defaults.** The limit returns the same response and sends no email. The database client uses the Neon WebSocket pool.
