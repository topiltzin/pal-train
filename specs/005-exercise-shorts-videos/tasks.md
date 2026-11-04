# Tasks: Exercise Demo Shorts

**Input**: Design documents from `specs/005-exercise-shorts-videos/`

**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/, quickstart.md

**Tests**: Included. The constitution (Principle II) requires test-first development for every feature, so each story writes its failing tests (RED) before its implementation (GREEN).

**Organization**: Tasks are grouped by user story so each story can be implemented, tested, and delivered on its own.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an unfinished task)
- **[Story]**: The user story the task serves (US1, US2, US3)
- Every task names its exact file path

---

## Phase 1: Setup

**Purpose**: Small shared setup before any feature code

- [X] T001 [P] Add an `import:demos` script to `package.json` that runs `npx tsx scripts/import-exercise-demos.ts`
- [X] T002 [P] Create the feature folder `src/features/demos/` and the test folders `tests/unit/demos/` and `tests/integration/demos/`, each with a `.gitkeep` so they are committed

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The table, the pure domain rules, and the repository that every story depends on. No story starts until this phase is complete.

**CRITICAL**: No user story work can begin until this phase is complete.

- [X] T003 Add the `exercise_demo_links` table to `src/lib/db/schema.ts`, with these constraints quoted from data-model.md: `video_id` is `varchar(11)`, not null, and "Must match `^[A-Za-z0-9_-]{11}$` (CHECK constraint)"; `source_title` is "1 to 200 characters (CHECK constraint)"; `channel` defaults to `'officialdemic'`; `active` defaults to `true`; `added_at` defaults to `now()`; `exercise_id` is not null and is not a foreign key; plus the partial unique index `exercise_demo_links_one_active` on `(exercise_id)` where `active = true`
- [X] T004 Generate the migration with `npm run db:generate` and confirm the new SQL file in `drizzle/` contains the CHECK constraints and the partial unique index
- [X] T005 Apply the migration with `npm run db:migrate` against the Neon database named in `.env.local`, and confirm the table exists (manual step; the operator runs it with `DATABASE_URL` set)
- [X] T006 [P] RED: write failing unit tests for the video id rule in `tests/unit/demos/video-id.test.ts`. Cases: accepts an 11-character id of letters, digits, `_` and `-`; rejects 10 and 12 characters; rejects a full URL, an id with spaces, and an id with quotes; `buildEmbedUrl` returns exactly `https://www.youtube-nocookie.com/embed/<id>?autoplay=1&playsinline=1&rel=0&modestbranding=1`; `shortsPageUrl` returns `https://www.youtube.com/shorts/<id>`
- [X] T007 GREEN: implement `src/features/demos/video-id.ts` with the named constant for the id length, `isValidVideoId`, `buildEmbedUrl`, and `shortsPageUrl`, so T006 passes
- [X] T008 [P] RED: write failing unit tests for the demo-link rules in `tests/unit/demos/demo-link.test.ts`. Cases: `toDemoView` returns only `videoId` and `title`, never `channel`, `addedAt`, or `id`; a title of 0 characters or of more than 200 characters is rejected; an invalid video id is rejected before storage
- [X] T009 GREEN: implement `src/features/demos/demo-link.ts` with the `DemoLink` type, `toDemoView`, and `validateNewDemoLink` so T008 passes
- [X] T010 [P] RED: write the shared contract test for the repository in `tests/unit/demos/demo-link-repository.contract.ts`, as a function that takes a repository and asserts: `listActiveByExerciseIds` returns only active links for the requested ids; `upsertActive` on an exercise with an active link makes the new link the only active one; `deactivate` removes the exercise from the list; an empty id list returns an empty result without a query
- [X] T011 GREEN: write the repository interface and an in-memory fake in `src/features/demos/demo-link-repository.ts`, so the shared contract passes against the fake
- [X] T012 Implement the Drizzle repository in `src/features/demos/drizzle-demo-link-repository.ts`. This is the only file that imports the database client. `upsertActive` runs in one transaction: deactivate the current active row, then insert the new active row (research.md section 7)
- [X] T013 Run the shared contract test against the Drizzle repository in `tests/integration/demos/drizzle-demo-link-repository.test.ts`, using the real Neon database and removing its own rows afterwards

**Checkpoint**: The table exists, the domain rules pass, and the Drizzle and in-memory repositories pass the same contract.

---

## Phase 3: User Story 1 - Watch an exercise demo without leaving the page (Priority: P1) MVP

**Goal**: A signed-in user taps "Watch demo" on a session-plan row, and the Short plays in a window on the same page.

**Independent Test**: With one link stored for an exercise, plan a session that includes it, tap "Watch demo", confirm the window plays on the same page, the address does not change, and Escape closes it with focus back on the button.

### Tests for User Story 1 (RED)

- [X] T014 [P] [US1] RED: write failing unit tests for attaching demos to a plan in `tests/unit/sessions/plan-demo-links.test.ts`. Cases: an exercise with an active link gets `demo: { videoId, title }`; an exercise without one gets `demo: null`; an exercise list with no ids skips the lookup
- [X] T015 [P] [US1] RED: write failing unit tests for the load timeout in `tests/unit/demos/load-timeout.test.ts`, using fake timers. Cases: the fallback callback fires after 10 seconds when the load never completes; a load before 10 seconds cancels the timer; cancelling twice is safe
- [X] T016 [US1] RED: add e2e cases in `tests/e2e/exercise-demo.spec.ts` (skipped without credentials, as the other signed-in specs are). Cases: a row with a demo shows "Watch demo"; tapping it keeps the page address unchanged; Escape closes the window and returns focus to the button; a row without a demo shows no button

### Implementation for User Story 1 (GREEN)

- [X] T017 [P] [US1] Add `demo: DemoView | null` to `ExerciseView` in `src/features/sessions/session-view.ts`, and keep `toExerciseView` copying the arrays
- [X] T018 [US1] Implement `attachDemos` in `src/features/demos/attach-demos.ts`, a pure function that maps the plan's exercises to `DemoView | null` from a lookup result, so T014 passes
- [X] T019 [US1] Update `src/features/sessions/handle-session-plan.ts` to take the demo repository as a parameter (defaulting to the Drizzle one), read the active links for the plan's exercise ids in one call, attach them with `attachDemos`, and on a lookup failure log the error with the request context and return `demo: null` for every exercise, so the plan still succeeds
- [X] T020 [US1] Wire the Drizzle repository into `src/app/api/session-plan/route.ts` (it already calls `handlePostSessionPlan`) Note: no change was needed; the handler defaults to the Drizzle repository, so the route already uses it.
- [X] T021 [US1] Implement `src/features/demos/load-timeout.ts` with a named 10-second constant and a function that starts the timer and returns a cancel function, so T015 passes
- [X] T022 [US1] Create `src/components/demo-dialog.tsx` per `contracts/demo-dialog.md`: native `<dialog>` opened with `showModal()`, `aria-labelledby` on the heading that names the exercise, the iframe created only on open with the privacy-enhanced embed URL, a history entry pushed on open so Back closes the window, focus returned to the opening button on close, the 10-second fallback with the "Open on YouTube" link, and the iframe removed on close
- [X] T023 [US1] Create `src/components/exercise-demo-button.tsx`: a "Watch demo" button with the accessible name `Watch demo: <exercise name>` that opens the dialog and keeps a reference to itself for focus return
- [X] T024 [US1] Update `src/components/session-plan-list.tsx` to render the button only on rows whose `exercise.demo` is not null
- [X] T025 [US1] Add integration cases to `tests/integration/api/session-plan.test.ts`: a plan with a stored link returns `demo` with the video id and title; a plan whose lookup fails still returns 200 with `demo: null`. Seed and remove the test link through the repository

**Checkpoint**: User Story 1 works end to end. Plan a session, tap "Watch demo", and the window plays on the same page.

---

## Phase 4: User Story 2 - Keep the demo links in the app's database (Priority: P2)

**Goal**: Links can be added, replaced, and removed in the database without a code change, and the page reflects the change on reload.

**Independent Test**: Insert a link directly, reload, see the control; remove it, reload, see no control; add a newer link for the same exercise, and confirm only the newer one is active.

### Tests for User Story 2 (RED)

- [X] T026 [P] [US2] RED: write failing integration tests in `tests/integration/demos/replace-active-link.test.ts` against Neon. Cases: adding a second link for an exercise leaves exactly one active row for it, and that row is the newer one; the older row is kept with `active = false`; deactivating the only link makes the exercise return no demo; a second insert that would create two active rows for one exercise is rejected by the database index

### Implementation for User Story 2 (GREEN)

- [X] T027 [US2] Confirm the transaction in `src/features/demos/drizzle-demo-link-repository.ts` (from T012) satisfies T026, and fix it if not Note: the Neon HTTP driver has no interactive transactions, so the replace is one batch, which runs atomically.
- [X] T028 [US2] Add the `deactivate(exerciseId)` operation to the repository interface, the in-memory fake, and the Drizzle implementation, so removal is a single step that keeps history
- [X] T029 [US2] Add an integration case to `tests/integration/api/session-plan.test.ts`: after `deactivate`, the plan returns `demo: null` for that exercise on the next request

**Checkpoint**: Links can be managed in the database, and the page follows the database state.

---

## Phase 5: User Story 3 - Match the channel's Shorts to the exercise list (Priority: P3)

**Goal**: The team reviews the channel's Shorts and imports only the accepted matches, with a record of every decision.

**Independent Test**: Run the import on the reviewed file, check that only `accept` rows are stored, that a second run changes nothing, and that every exercise is listed either with its Short or as having no demo.

### Tests for User Story 3 (RED)

- [X] T030 [P] [US3] RED: write failing unit tests for the import parser in `tests/unit/demos/import-rows.test.ts`. Cases: only rows with `decision = accept` are returned; a row with an invalid video id is reported as an error, not stored; a row whose title is empty is reported; two accepted rows for the same `exercise_id` are an error that names the exercise
- [X] T031 [P] [US3] RED: write a failing integration test in `tests/integration/demos/import-demos.test.ts` that runs the import twice on a small fixture CSV and asserts the second run creates no new rows and leaves one active link per exercise

### Implementation for User Story 3 (GREEN)

- [X] T032 [US3] Implement `src/features/demos/import-rows.ts`: parse the reviewed CSV columns `exercise_id, video_id, source_title, decision, note`, keep only `accept` rows, and validate each with the domain rules, so T030 passes
- [X] T033 [US3] Implement `scripts/import-exercise-demos.ts`: read the CSV path from its argument, parse it with `import-rows.ts`, upsert each accepted row through the Drizzle repository, and print a summary such as `Imported 6 links, skipped 0 rejected rows.` It must be idempotent, so T031 passes
- [X] T034 [US3] Create the reviewed match file `specs/005-exercise-shorts-videos/demo-links.reviewed.csv` from the title scan. Each candidate is a row with its `decision` set to `accept` or `reject` and a `note`. Mark accept only where the title names the same movement as the exercise. Include the six "Untitled" Shorts as `reject` rows noting "no readable title". The user must approve the decisions before the import runs Note: the file is created with PROPOSED decisions. The import has not been run; it waits for approval.

**Checkpoint**: The import is reviewed, repeatable, and records a decision for every candidate.

---

## Final Phase: Polish & Cross-Cutting Concerns

- [X] T035 Run the security review from `quickstart.md` section 6 and record its result in `specs/005-exercise-shorts-videos/security-review.md`, covering parameterised queries, the fixed embed host, the API's returned fields, the import's input, and the signed-in requirement
- [X] T036 Run `npm run test:coverage` and confirm the new and changed files reach at least 80% coverage
- [X] T037 Run `npm run typecheck`, `npm run lint`, and `npm test`, and fix anything they report
- [X] T038 Check the constitution's limits on the changed files: no file over 800 lines, no `console.log`, no unnamed numeric limits; use named constants
- [X] T039 Run the manual steps in `quickstart.md` sections 4 and 5 and record the result Note: the window was checked in a browser (open, Escape, Back, Close, the failure message, and the link). The signed-in plan path was not run, since it needs test credentials.

---

## Dependencies & Execution Order

### Phase dependencies

- **Setup (Phase 1)**: no dependencies
- **Foundational (Phase 2)**: depends on Setup; blocks every user story
- **User stories (Phases 3 to 5)**: each depends on Foundational. US1 is the MVP. US2 builds on the repository from Phase 2 and the plan test in US1, so run it after US1. US3 is independent of US1 and US2 once Phase 2 is complete, except that its import output is what the page shows, so it is most useful after US1
- **Polish (Final)**: depends on all user stories

### Within each story

- RED tests before implementation (constitution II)
- Domain before repository, repository before the API, API before the UI

### Parallel opportunities

- Phase 1: T001 and T002 in parallel
- Phase 2: T006, T008, and T010 in parallel (different test files), then their implementations
- US1 RED: T014, T015, and T016 in parallel
- US1 implementation: T017 in parallel with T021; T022 and T023 in parallel after T021
- US3 RED: T030 and T031 in parallel

## Implementation Strategy

### MVP first (User Story 1 only)

1. Phase 1 and Phase 2 (the table and the domain)
2. Phase 3 (User Story 1)
3. Stop, test with one manually inserted link, and check the in-page window works

### Incremental delivery

1. MVP as above
2. Add User Story 2 (managing links in the database)
3. Add User Story 3 (the reviewed import), after the matches are approved
4. Polish

### Known gap

SC-003 (at least 8 verified links) depends on the review in T034. A title scan finds roughly 6 to 10 true matches, so if the review accepts fewer than 8, the success criterion must be revisited with the user before release.
