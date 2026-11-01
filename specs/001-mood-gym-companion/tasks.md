# Tasks: Mood-Based Gym Companion

**Input**: Design documents from `/specs/001-mood-gym-companion/`

**Prerequisites**: [plan.md](./plan.md) (required), [spec.md](./spec.md) (required), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/api.md](./contracts/api.md), [quickstart.md](./quickstart.md)

**Tests**: Included. The constitution (Principle II) makes test-first development mandatory for every feature, so every story begins with its RED tests.

**Organization**: Tasks are grouped by user story so each story can be implemented and tested independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story the task belongs to (US1, US2, US3). Setup, Foundational, and Polish tasks have no story label.
- Every task names the exact file path it creates or changes.

## Path Conventions

Single Next.js project at the repository root, per [plan.md](./plan.md) Project Structure: `app/`
(routes), `src/` (features, lib, components), `content/templates/` (workout content), `tests/`
(unit, integration, e2e).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project scaffold, tooling, and provisioned marketplace integrations

- [X] T001 Create the Next.js 16 TypeScript App Router project scaffold at the repository root: `package.json`, `tsconfig.json`, `next.config.ts`
- [X] T002 Provision the Auth0 integration with `vercel integration add auth0/client --yes --no-claim`, after the `vercel:auth` skill confirms the provider choice. If a dashboard or browser step is required, stop and ask the user to complete it, then continue.
- [ ] T003 Provision the Neon Postgres integration with `vercel integration add neon --yes --no-claim`, then run `vercel env pull --yes` to create `.env.local`. Do not commit `.env.local`.
- [X] T004 [P] Configure Tailwind CSS in `postcss.config.mjs` and `app/globals.css`
- [X] T005 [P] Configure Vitest with V8 coverage and an 80% threshold in `vitest.config.ts`
- [X] T006 [P] Configure Playwright with a 320 px mobile project in `playwright.config.ts`
- [X] T007 [P] Configure ESLint and Prettier in `eslint.config.mjs` and `.prettierrc`
- [X] T008 Add the npm scripts `test`, `test:integration`, `test:e2e`, `test:coverage`, `validate:content`, `typecheck`, and `lint` in `package.json` (after T001)
- [X] T009 [P] Create `.env.example` listing `AUTH0_SECRET`, `AUTH0_BASE_URL`, `AUTH0_ISSUER_BASE_URL`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`, and `DATABASE_URL`, with no values
- [X] T010 [P] Add `.env*.local` and `.vercel` to `.gitignore`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared infrastructure that every user story needs: env validation, API envelope, mood and focus definitions, the template library, the database, and sign-in. No user story can start until this phase is complete.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

### RED tests for the foundation

- [X] T011 [P] Unit test that a missing or empty required environment variable fails at startup, in `tests/unit/config/env.test.ts`
- [X] T012 [P] Unit test that success, error, and list responses match the envelope (`success`, `data`, `error`, `meta`), in `tests/unit/api/envelope.test.ts`
- [X] T013 [P] Unit test of the template schema constraints, in `tests/unit/library/template-schema.test.ts`. Quote the data-model rules: `name` is "3 to 60 characters"; `duration_minutes` is an "integer" from "10 to 90"; `intensity` is required and must be "low", "moderate", or "high"; `equipment` is a "non-empty array"; `moods` is a "non-empty array" where "Every mood must exist"; `caution` is "Required for `high` intensity with heavy lifts or high-impact cardio"
- [X] T014 [P] Unit test of the content invariants, in `tests/unit/library/content-invariants.test.ts`: "at least 100 templates in total", "at least 8 per focus area", and unique `id` values across all files
- [X] T015 [P] Integration test that a signed-out request to a protected route returns `401 UNAUTHENTICATED`, in `tests/integration/auth/require-session.test.ts`
- [X] T016 [P] Integration test of user upsert, in `tests/integration/auth/user-upsert.test.ts`: the first sign-in creates one user, a second sign-in does not duplicate it, and `display_name` falls back to the email local part
- [X] T017 [P] Integration test of `GET /api/me` (contract: `contracts/api.md`), in `tests/integration/api/me.test.ts`
- [X] T018 [P] End-to-end test of the sign-in gate (quickstart Scenario 1), in `tests/e2e/sign-in-gate.spec.ts`

### Implementation of the foundation

- [X] T019 Implement fail-fast environment validation with zod in `src/lib/config/env.ts` (makes T011 pass)
- [X] T020 [P] Implement the response envelope and the error-code enum in `src/lib/api/envelope.ts` and `src/lib/api/error-codes.ts` (makes T012 pass)
- [X] T021 [P] Define the eight moods (`energized`, `tired`, `stressed`, `focused`, `playful`, `unmotivated`, `want-to-sweat`, `calm`) with `label`, `buddyLine`, `accent`, and `intensityRange` in `src/features/moods/moods.ts`
- [X] T022 [P] Define the eight focus areas (`chest`, `biceps`, `triceps`, `back`, `legs`, `cardio`, `hyrox-style`, `conditioning`) with `label` and `description` in `src/features/library/focus-areas.ts`
- [X] T023 Implement the template zod schema in `src/features/library/template.schema.ts` with the constraints quoted in T013 (makes T013 pass)
- [X] T024 Implement the library repository interface (`list`, `byId`, `byFocus`) and an in-memory content loader in `src/features/library/library-repository.ts`. It throws a `LIBRARY_UNAVAILABLE` error when content fails to load.
- [X] T025 [P] Author at least 13 templates for the focus area `chest` in `content/templates/chest.json`, each validating against the T023 schema, with `intensity` and `caution` set according to the data-model rules
- [X] T026 [P] Author at least 13 templates for `biceps` in `content/templates/biceps.json`, validating against the T023 schema
- [X] T027 [P] Author at least 13 templates for `triceps` in `content/templates/triceps.json`, validating against the T023 schema
- [X] T028 [P] Author at least 13 templates for `back` in `content/templates/back.json`, validating against the T023 schema
- [X] T029 [P] Author at least 13 templates for `legs` in `content/templates/legs.json`, validating against the T023 schema
- [X] T030 [P] Author at least 13 templates for `cardio` in `content/templates/cardio.json`, validating against the T023 schema. Templates with high-impact work carry a `caution`.
- [X] T031 [P] Author at least 13 templates for `hyrox-style` in `content/templates/hyrox-style.json`, validating against the T023 schema
- [X] T032 [P] Author at least 13 templates for `conditioning` in `content/templates/conditioning.json`, validating against the T023 schema. Together T025 to T032 give at least 104 templates (SC-003).
- [X] T033 Implement the content validation script in `scripts/validate-content.ts` and wire it to `npm run validate:content` (makes T014 pass)
- [X] T034 Implement the Drizzle config in `drizzle.config.ts` and the schema in `src/lib/db/schema.ts`. Quote the data-model rules. `users`: `id` is the Auth0 `sub` and "Immutable"; `email` is "unique, not null"; `display_name` is "text, not null", "1 to 40 characters", defaulting to the email local part; `created_at` is "timestamp, not null". `suggestion_state`: `user_id` is the primary key and a foreign key to `users.id` with cascade delete; `last_template_id` is "text, nullable"; `updated_at` is "timestamp, not null".
- [X] T035 Implement the database client in `src/lib/db/client.ts`, using `DATABASE_URL` and the Neon driver
- [X] T036 Generate the first migration into `drizzle/` and apply it to the dev Neon branch
- [X] T037 Implement the Auth0 session helpers in `src/features/auth/session.ts`: `getCurrentUser` and `requireUser`, which returns `UNAUTHENTICATED` when no session exists (makes T015 pass)
- [X] T038 Implement the Auth0 middleware in `middleware.ts` that mounts the SDK routes `/auth/login`, `/auth/logout`, and `/auth/callback`
- [X] T039 Implement user upsert from session claims in `src/features/auth/user-repository.ts` (makes T016 pass)
- [X] T040 Implement `GET /api/me` in `app/api/me/route.ts` (makes T017 pass)
- [X] T041 Implement the buddy sign-in screen in `app/(public)/sign-in/page.tsx`: friendly buddy copy, sign-in action, no workout content (FR-016)
- [X] T042 Implement the authenticated shell in `app/(app)/layout.tsx`: redirect signed-out visitors to sign-in, and show the greeting with the display name (FR-018)
- [X] T043 Map `LIBRARY_UNAVAILABLE` to a `503` envelope response in `src/lib/api/errors.ts`, with a generic user-safe message (FR-014)

**Checkpoint**: Foundation ready. Sign-in works, the library validates, and the database is migrated. User story work can now begin.

---

## Phase 3: User Story 1 - Pick a Mood and Get a Workout Idea (Priority: P1) 🎯 MVP

**Goal**: A signed-in user picks a mood and sees one to three workout ideas that fit it, with the buddy tone and the "idea, not a plan" framing.

**Independent Test**: Sign in, select "Energized", and confirm one to three suggestions appear with name, focus, duration, intensity, equipment, and the not-medical-advice notice. Select "Tired" and confirm every suggestion is low or moderate intensity (quickstart Scenarios 2 and 3).

### RED tests for User Story 1

- [X] T044 [P] [US1] Unit test of the selection rules in `tests/unit/suggestions/select-suggestions.test.ts`: a mood filters templates; the result has one to three items; `partial` is `false` when matches exist; the last shown template is excluded when alternatives exist (FR-004, FR-007, FR-008)
- [X] T045 [P] [US1] Integration test of `POST /api/suggestions` in `tests/integration/api/suggestions.test.ts`: `401` when signed out; `400 INVALID_INPUT` when neither `mood` nor `focus` is given; `400` for an unknown mood; `200` with the envelope and one to three items; `suggestion_state` is updated
- [ ] T046 [P] [US1] End-to-end test in `tests/e2e/mood-suggestion.spec.ts`: no workout is shown before a mood is picked, and "Energized" and "Tired" produce the expected intensity bands (quickstart Scenarios 1.3, 2, and 3)

### Implementation for User Story 1

- [X] T047 [US1] Implement the pure selection rules in `src/features/suggestions/select-suggestions.ts` (makes T044 pass)
- [X] T048 [US1] Implement the suggestion-state repository in `src/features/suggestions/suggestion-state-repository.ts`, with get and upsert of `last_template_id`
- [X] T049 [US1] Implement `POST /api/suggestions` in `app/api/suggestions/route.ts`, validating the body with zod and calling the selection rules (makes T045 pass)
- [X] T050 [P] [US1] Implement `GET /api/moods` in `app/api/moods/route.ts`, with the mood list and buddy lines
- [X] T051 [P] [US1] Implement the playful mood picker in `src/components/mood-picker.tsx`: one card per mood, showing the mood's accent
- [X] T052 [US1] Implement the home page in `app/(app)/page.tsx`: mood picker, empty state that invites a pick (quickstart 1.3), and a call to `POST /api/suggestions`
- [X] T053 [US1] Implement the suggestion list in `src/components/suggestion-list.tsx`: name, focus, duration, intensity, equipment, and the `caution` when present (FR-006, FR-011)
- [X] T054 [US1] Implement the not-medical-advice notice in `src/components/medical-notice.tsx` and show it on the home page (FR-010)

**Checkpoint**: User Story 1 works on its own. This is the MVP increment.

---

## Phase 4: User Story 2 - Choose a Focus Area Directly (Priority: P2)

**Goal**: A signed-in user can pick a focus area without a mood, or combine a focus area with a mood. When no template matches both, the page shows the closest matches and says so.

**Independent Test**: Select "Back" with no mood and confirm only back templates appear, each tagged with its moods. Select "Focused" with "Back" and confirm only matching templates, or a visible partial-match note (quickstart Scenario 4).

### RED tests for User Story 2

- [X] T055 [US2] Extend `tests/unit/suggestions/select-suggestions.test.ts` with cases for focus-only selection, the intersection of mood and focus, and `partial: true` when no template matches both
- [X] T056 [P] [US2] Integration test in `tests/integration/api/suggestions-focus.test.ts`: `POST /api/suggestions` with `focus` only; with both `mood` and `focus`; and the `partial` flag when no template matches both
- [ ] T057 [P] [US2] End-to-end test in `tests/e2e/focus-direct.spec.ts` (quickstart Scenario 4)

### Implementation for User Story 2

- [X] T058 [US2] Extend the selection rules in `src/features/suggestions/select-suggestions.ts` for focus-only, intersection, and the closest-match fallback (makes T055 pass)
- [X] T059 [P] [US2] Implement `GET /api/focus-areas` in `app/api/focus-areas/route.ts`
- [X] T060 [P] [US2] Implement the focus picker in `src/components/focus-picker.tsx`
- [X] T061 [US2] Wire the focus picker and the partial-match note into `app/(app)/page.tsx` and `src/components/suggestion-list.tsx`

**Checkpoint**: User Stories 1 and 2 both work independently.

---

## Phase 5: User Story 3 - Browse the Template Library and Shuffle (Priority: P3)

**Goal**: A user can browse the full library for a focus area with filters, open a template's details, and ask for "Another idea" without an immediate repeat.

**Independent Test**: Tap "Another idea" several times and confirm each suggestion differs from the one before. Open the cardio library, filter to low intensity and 20 minutes or less, and confirm only matching templates appear (quickstart Scenarios 5 and 6).

### RED tests for User Story 3

- [X] T062 [P] [US3] Integration test of `GET /api/templates` in `tests/integration/api/templates.test.ts`: `400` without `focus`; `404` for an unknown focus; `intensity` and `maxMinutes` filters; `limit` between 1 and 50 with a default of 20; `meta` paging totals
- [X] T063 [P] [US3] Integration test of `GET /api/templates/{id}` in `tests/integration/api/template-detail.test.ts`: `200` for a known id and `404 NOT_FOUND` for an unknown one
- [X] T064 [P] [US3] Integration test of `POST /api/suggestions/next` in `tests/integration/api/suggestions-next.test.ts`: the first result is never the user's `last_template_id` unless it is the only match (FR-008)
- [ ] T065 [P] [US3] End-to-end test in `tests/e2e/library-and-shuffle.spec.ts` (quickstart Scenarios 5 and 6)

### Implementation for User Story 3

- [X] T066 [US3] Implement `GET /api/templates` in `app/api/templates/route.ts` with the filters and paging from `contracts/api.md` (makes T062 pass)
- [X] T067 [P] [US3] Implement `GET /api/templates/{id}` in `app/api/templates/[id]/route.ts` (makes T063 pass)
- [X] T068 [US3] Implement `POST /api/suggestions/next` in `app/api/suggestions/next/route.ts`, reusing the selection rules and the no-repeat rule (makes T064 pass)
- [X] T069 [P] [US3] Implement the filter controls in `src/components/template-filters.tsx` for intensity and maximum minutes
- [X] T070 [US3] Implement the library page in `app/library/[focus]/page.tsx`: the template list with filters and paging, and a link from each card to its detail
- [X] T071 [US3] Add the "Another idea" button in `src/components/suggestion-list.tsx`, calling `POST /api/suggestions/next`

**Checkpoint**: All three user stories work independently.

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Cross-story quality, the required security review, coverage, and the final validation pass

- [ ] T072 [P] Implement the library-unavailable state in `src/components/library-error.tsx`, which keeps the mood and focus controls visible (FR-014). Cover it with a test in `tests/e2e/library-outage.spec.ts` (quickstart Scenario 8.2).
- [X] T073 [P] Write and run the 320 px layout check in `tests/e2e/phone-layout.spec.ts`: no horizontal scrolling and all controls reachable (FR-013, SC-006)
- [ ] T074 Apply the playful visual direction across `app/globals.css` and `src/components/*.tsx`, using the `design-taste-frontend` guidance (FR-017)
- [ ] T075 Run the required security review of the auth and session code (constitution Quality Gates). Record the findings and their resolution in `specs/001-mood-gym-companion/security-review.md`. Resolve every CRITICAL and HIGH finding.
- [X] T076 Run `npm run test:coverage` and add missing unit and integration tests until coverage is at least 80% (constitution II)
- [X] T077 Remove debug output (`console.log`, ad-hoc `print`) from `src/`, `app/`, and `tests/`. Confirm no source file exceeds 800 lines (constitution I, III).
- [ ] T078 Run the quickstart validation scenarios 1 to 8 from `specs/001-mood-gym-companion/quickstart.md` and record the results

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies. T002 and T003 need the user's marketplace access.
- **Foundational (Phase 2)**: Depends on Setup. BLOCKS all user stories.
- **User Stories (Phase 3+)**: All depend on Foundational. Story order is P1, then P2, then P3, but they can proceed in parallel once the foundation is ready.
- **Polish (Phase N)**: Depends on the user stories you intend to ship.

### User Story Dependencies

- **US1 (P1)**: Starts after Phase 2. No dependency on other stories.
- **US2 (P2)**: Starts after Phase 2. It extends the selection rules that US1 creates (T047 to T058), so it is best started after T047 is done.
- **US3 (P3)**: Starts after Phase 2. It reuses the selection rules and the suggestion-state repository from US1 (T048, T068).

### Within Each User Story

- RED tests are written and fail before their implementation tasks.
- Pure rules (`select-suggestions.ts`) before route handlers.
- Route handlers before UI that calls them.
- The story checkpoint is reached before the next priority starts.

### Parallel Opportunities

- Setup: T004, T005, T006, T007, T009, and T010 run in parallel.
- Foundational tests: T011 to T018 run in parallel.
- Content authoring: T025 to T032 run in parallel, one focus area per author.
- Within US1: T050 and T051 run in parallel.
- Across stories: once Phase 2 is done, US1, US2, and US3 can be staffed in parallel.

---

## Parallel Example: User Story 1

```bash
# RED tests for US1 together:
Task: "Unit test of the selection rules in tests/unit/suggestions/select-suggestions.test.ts"
Task: "Integration test of POST /api/suggestions in tests/integration/api/suggestions.test.ts"
Task: "End-to-end test in tests/e2e/mood-suggestion.spec.ts"

# Independent UI and route pieces once the rules pass:
Task: "Implement GET /api/moods in app/api/moods/route.ts"
Task: "Implement the playful mood picker in src/components/mood-picker.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (including the marketplace provisioning in T002 and T003).
2. Complete Phase 2: Foundational. This is the critical gate.
3. Complete Phase 3: User Story 1.
4. **STOP and VALIDATE**: run quickstart Scenarios 1, 2, and 3.
5. Deploy a preview if ready.

### Incremental Delivery

1. Setup + Foundational: foundation ready.
2. Add US1: test independently, then preview deploy (MVP).
3. Add US2: test independently, then deploy.
4. Add US3: test independently, then deploy.
5. Polish: security review, coverage, and the full quickstart pass before the production release.

---

## Notes

- [P] tasks touch different files and have no dependencies on incomplete tasks.
- The [Story] label maps each task to its user story for traceability.
- Verify that each RED test fails before writing its implementation.
- Commit after each task or logical group, using Conventional Commits.
- Stop at any checkpoint to validate a story on its own.
- Template content (T025 to T032) is generated with the `fitness-coach` skill. Each file is reviewed against the schema before it is committed.
