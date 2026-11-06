# Tasks: Umami Web Analytics

**Input**: Design documents from `/specs/007-umami-analytics/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/, quickstart.md

**Tests**: Included. The constitution (Principle II) requires test-first development for every new feature, so each story writes its failing tests before its implementation.

**Organization**: Tasks are grouped by user story (US1 page views, US2 named events, US3 signed-in identity). Stories are sequential because they share `src/app/layout.tsx` and `src/features/analytics/`; tasks marked [P] within a story touch different files.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: US1, US2, or US3 (setup, foundational, and polish tasks have no story label)
- Exact file paths in every description

## Path Conventions

- Logic: `src/features/analytics/`
- React pieces: `src/components/analytics/`
- Unit tests: `tests/unit/analytics/`
- End-to-end tests: `tests/e2e/analytics-*.spec.ts`
- Sign-in helper (existing, reuse): `tests/e2e/helpers/sign-in.ts`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Make the new configuration names visible to everyone who sets up the app.

- [X] T001 Add the three analytics variable names with empty values to `.env.example`: `UMAMI_SCRIPT_URL`, `UMAMI_WEBSITE_ID`, `ANALYTICS_HASH_SECRET`, with a comment that they are all-or-nothing and that analytics is off when all are unset (see `contracts/tracker-config.md`)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Configuration parsing and the guarded client wrapper. Every story depends on both.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T002 [P] Write failing unit tests in `tests/unit/analytics/analytics-env.test.ts` covering: no analytics variable set returns disabled; all three set and valid returns the config; one or two set throws an error naming the missing variables; `UMAMI_SCRIPT_URL` that is not an absolute `https` URL is rejected; `ANALYTICS_HASH_SECRET` shorter than 32 characters is rejected (quote from `data-model.md`: "At least 32 characters")
- [X] T003 Implement `src/features/analytics/analytics-env.ts` as an optional, all-or-nothing parser so that T002 passes. It must not reuse the app-wide `src/lib/config/env.ts` schema, because analytics must stay optional (research §9)
- [X] T004 [P] Write failing unit tests in `tests/unit/analytics/track.test.ts` covering: no `window` (server render) is a no-op; `window.umami` missing is a no-op; when present, `umami.track(name, data)` is called with the given name and data; an exception thrown by `umami.track` is caught and does not reach the caller (FR-009)
- [X] T005 Implement `src/features/analytics/track.ts` as the guarded wrapper around `window.umami` so that T004 passes. Keep it a single exported function `track(name, data?)`

**Checkpoint**: Configuration and guarded tracking are tested. User stories may begin.

---

## Phase 3: User Story 1 - See how people use the app (Priority: P1) 🎯 MVP

**Goal**: Every full page load and in-app page change is recorded as a page view, with no cookies, Do Not Track honored, and internal traffic excluded (spec US1, FR-001 to FR-003, FR-008, FR-011, FR-012).

**Independent Test**: Load any page with analytics configured against a stub tracker. The tracker script is requested with the website ID, the production hostname in `data-domains`, `data-do-not-track="true"`, and `data-exclude-search="true"`. Navigating in-app triggers a further page view. With all analytics variables unset, no script tag is rendered.

### Tests for User Story 1 ⚠️

> **NOTE: Write these tests FIRST and confirm they FAIL before implementation**

- [X] T006 [P] [US1] Write failing unit tests in `tests/unit/analytics/tracker-attributes.test.ts` for `buildTrackerAttributes(config, appBaseUrl)`: `data-website-id` equals the configured ID; `data-domains` equals only the hostname of `APP_BASE_URL` (no scheme, no path); `data-do-not-track` is `"true"`; `data-exclude-search` is `"true"`; no `data-distinct-id` key is present; the hash secret never appears in any attribute value
- [X] T007 [P] [US1] Write failing end-to-end test in `tests/e2e/analytics-pageviews.spec.ts`: use Playwright route interception to serve a stub tracker for the configured script URL; load the sign-in page and assert the stub was requested with the expected `data-website-id`; navigate within the app and assert a second page view is recorded; with analytics unset, assert no tracker request is made. Use `tests/e2e/helpers/sign-in.ts` for the signed-in case

### Implementation for User Story 1

- [X] T008 [US1] Implement `src/features/analytics/tracker-attributes.ts` exporting `buildTrackerAttributes` so that T006 passes. It must be a pure function that returns a new object (constitution Principle I, no mutation)
- [X] T009 [US1] Create `src/components/analytics/umami-script.tsx`: a server component that reads the config through `analytics-env.ts`, returns `null` when analytics is disabled, and otherwise renders `next/script` with `src` set to `UMAMI_SCRIPT_URL`, `strategy="afterInteractive"`, and the attributes from `buildTrackerAttributes`
- [X] T010 [US1] Render `UmamiScript` inside `<body>` in `src/app/layout.tsx`, so that the sign-in page and every app page are tracked
- [X] T011 [US1] Resolve research SPIKE 1: run `npm run build`, check whether the root layout stays static under `cacheComponents: true` (`next.config.ts`), and record the result in `specs/007-umami-analytics/research.md`. If rendering becomes dynamic, wrap `UmamiScript` in a `Suspense` boundary inside `src/app/layout.tsx`
- [ ] T012 [US1] Run `tests/e2e/analytics-pageviews.spec.ts` and `tests/unit/analytics/tracker-attributes.test.ts` until both pass

**Checkpoint**: User Story 1 is functional. Page views are recorded with the required privacy attributes and nothing is rendered when analytics is off. This is the MVP increment.

---

## Phase 4: User Story 2 - Measure the workout journey with named events (Priority: P2)

**Goal**: Four named events fire once per successful action, each carrying only the allowed fields (spec US2, FR-004, FR-005).

**Independent Test**: With the stub tracker from US1, perform each action once: tap "Watch demo", request a plan, tap "another idea", select a mood. Each produces exactly one event with the data listed in `contracts/event-catalog.md`. A failed plan request produces no event.

### Tests for User Story 2 ⚠️

- [X] T013 [P] [US2] Write failing unit tests in `tests/unit/analytics/event-catalog.test.ts` covering: exactly the four names `exercise demo watched`, `session plan requested`, `suggestion requested`, `mood selected` exist; every name is at most 50 characters (`contracts/event-catalog.md`); `exercise demo watched` allows only `exerciseId` and it is at most 100 characters; a field not listed for an event is rejected; no allowed field name matches the denylist `email`, `name`, `mood`, `note`, `weight`, `measurement`; `session started`, `session completed`, and `mood check-in saved` are absent
- [X] T014 [P] [US2] Write failing end-to-end test in `tests/e2e/analytics-events.spec.ts`: with the stub tracker, perform each of the four actions once and assert exactly one matching `track` call per action with the expected data; assert `mood selected` carries no data; make the plan request fail via route interception and assert no `session plan requested` event is sent (FR-004)
- [X] T015 [US2] Add a failing case to `tests/unit/analytics/track.test.ts` asserting that `track` rejects an event name that is not in the catalog and sends nothing

### Implementation for User Story 2

- [X] T016 [US2] Implement `src/features/analytics/event-catalog.ts` with the four entries and their allowed fields so that T013 passes. Strings are at most 500 characters and numbers at most 4 decimal places (`contracts/event-catalog.md`)
- [X] T017 [US2] Make `track()` in `src/features/analytics/track.ts` validate names and data against the catalog before sending, so that T015 passes
- [X] T018 [US2] Pass the exercise identifier into `ExerciseDemoButton` from its caller `src/components/session-plan-list.tsx` (it currently receives only `exercise.name` and `demo`), then in `src/components/exercise-demo-button.tsx` call `track("exercise demo watched", { exerciseId })` inside `openWindow`
- [X] T019 [P] [US2] In `src/components/session-planner.tsx`, call `track("session plan requested")` only after `fetchPlan` returns a successful plan, not on request or on error
- [X] T020 [P] [US2] In `src/components/home-experience.tsx`, call `track("suggestion requested")` when "another idea" successfully shows a new suggestion
- [X] T021 [P] [US2] In `src/components/mood-stack.tsx`, call `track("mood selected")` in the selection handler with no data argument (FR-005)
- [ ] T022 [US2] Run `tests/e2e/analytics-events.spec.ts` and `tests/unit/analytics/event-catalog.test.ts` until both pass

**Checkpoint**: User Stories 1 and 2 work. Each of the four events is sent once per successful action, with no personal data.

---

## Phase 5: User Story 3 - Connect activity to a signed-in user without exposing identity (Priority: P3)

**Goal**: A signed-in user is identified to analytics by a keyed hash of their Auth0 subject, never by email, name, or the raw subject (spec US3, FR-006, FR-007).

**Independent Test**: Sign in on two browser contexts as the same user. Both send the same identity value, which is 40 hex characters and differs from the raw subject. No request contains the email or name. A new browser context after sign-out sends no identity until sign-in.

### Tests for User Story 3 ⚠️

- [X] T023 [P] [US3] Write failing unit tests in `tests/unit/analytics/identity.test.ts` for `hashDistinctId(secret, subject)`: the same inputs give the same output; a different subject gives a different output; a different secret gives a different output; the output is exactly 40 lowercase hex characters (quote from `data-model.md`: "40 hex characters", "at most 50 characters"); the output does not contain the subject or any part of an email address
- [X] T024 [P] [US3] Write failing end-to-end test in `tests/e2e/analytics-identity.spec.ts`, reusing `tests/e2e/helpers/sign-in.ts`: sign in as a test user in two contexts and assert both send the same `identify` value; assert the value is 40 hex characters; assert no request body contains the test user's email or name; after sign-out, assert a fresh page load sends no `identify` call before sign-in

### Implementation for User Story 3

- [X] T025 [US3] Implement `src/features/analytics/identity.ts` exporting `hashDistinctId` using HMAC-SHA256 from `node:crypto`, truncated to 40 characters, so that T023 passes. It is imported only by server code; `grep` confirms no client component imports it (see T032)
- [X] T026 [US3] Create `src/components/analytics/umami-identify.tsx`: a client component that takes a `distinctId` prop and calls `umami.identify(distinctId)` once on mount, via the guarded wrapper, and does nothing when analytics is disabled
- [X] T027 [US3] In `src/app/(app)/layout.tsx`, compute `hashDistinctId(secret, claims.sub)` inside `AuthenticatedShell` when analytics is enabled, and render `UmamiIdentify` with it. The raw `claims.sub`, `claims.email`, and display name must not be passed to the component
- [X] T028 [US3] Resolve research SPIKE 2: determine whether Umami keeps the distinct ID in `localStorage`, `sessionStorage`, or memory only, and record the answer in `specs/007-umami-analytics/research.md`. If it persists beyond a page load, add a guarded clear step in the sign-out path (the link to `/auth/logout` in `src/features/navigation/app-nav-items.ts`, rendered by `src/components/card-nav.tsx`) and extend T024 to assert it
- [ ] T029 [US3] Run `tests/e2e/analytics-identity.spec.ts` and `tests/unit/analytics/identity.test.ts` until both pass

**Checkpoint**: All three user stories work independently and together.

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Quality gates, security, and the manual checks in `quickstart.md`

- [X] T030 [P] Run `npm run test:coverage` and confirm coverage of `src/features/analytics/` and `src/components/analytics/` is at least 80% (constitution Principle II)
- [X] T031 [P] Run `npm run typecheck`, `npm run lint`, and `npm run build` (scripts defined in `package.json`); all must pass
- [X] T032 Confirm the identity secret and raw subject are not exposed: after `npm run build`, search `.next/static` for the value of `ANALYTICS_HASH_SECRET` and for a known test subject, expecting zero matches; search `src/components` for imports of `features/analytics/identity` and `analytics-env`, expecting none in client components
- [X] T033 Check the constitution's code rules in the analytics files: no `console.log`, no function over 50 lines, no file over 800 lines, no nesting deeper than 4 levels
- [ ] T034 Run the dedicated security review (constitution quality gate for user data and external calls) with the `security-reviewer` agent over `src/features/analytics/`, `src/components/analytics/`, and the layout changes; resolve every CRITICAL and HIGH finding before merge and record the result in the pull request description
- [ ] T035 Run the manual checks in `specs/007-umami-analytics/quickstart.md` sections 4 and 5 against a preview deployment with analytics configured, and record the results in that file
- [ ] T036 Commit in Conventional Commits form (`feat: ...`, for example `feat: add umami web analytics`), with no co-author trailer, and split into one commit per phase where practical. Commit only when the user asks

---

## Dependencies & Execution Order

### Phase dependencies

- **Setup (Phase 1)**: no dependencies
- **Foundational (Phase 2)**: depends on Setup; blocks all stories
- **User Stories (Phases 3 to 5)**: depend on Foundational. They run in order US1, US2, US3, because they share `src/app/layout.tsx` and the analytics feature folder
- **Polish (Phase N)**: depends on the stories it checks

### Story dependencies

- **US1 (P1)**: needs Foundational only. It is the MVP.
- **US2 (P2)**: needs US1 for its end-to-end tests (the stub tracker and in-app navigation) and the Foundational `track()`.
- **US3 (P3)**: needs US1 (`UmamiScript` and the enabled check) and Foundational `track()`. It is independent of US2 in code, but shares the test helpers.

### Within each story

Tests first and failing, then implementation, then the story's test run goes green. The SPIKE tasks (T011, T028) can only close after the code they check exists.

### Parallel opportunities

- Phase 2: T002 and T004 (different test files)
- US1: T006 and T007
- US2: T013 and T014; then T019, T020, and T021 (three different component files)
- US3: T023 and T024
- Polish: T030 and T031

---

## Implementation Strategy

### MVP first

Deliver Phase 1, Phase 2, and Phase 3 (US1) first. That gives the team page views with the privacy attributes, which is the spec's P1 value, and it can be deployed behind the optional configuration without affecting users.

### Incremental delivery

1. US1: page views live in the team's Umami instance
2. US2: the four events, one small call-site change at a time
3. US3: identity linking, which carries the most privacy responsibility, shipped last and after the security review

### Spec gaps (not tasked)

Per the plan's Spec Gaps section, these spec items have no matching product action and get no tasks until the spec is updated: `session started`, `session completed`, and `mood check-in saved`.
