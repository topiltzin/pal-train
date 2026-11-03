# Tasks: Session Length Range

**Input**: Design documents from `specs/003-session-length-range/` (plan.md, spec.md, research.md, data-model.md, contracts/session-plan-api.md, quickstart.md)

**Tests**: Included. Constitution Principle II requires test-first development for new features (RED, then GREEN, then IMPROVE). Each test task says it must fail before its implementation task runs.

**Organization**: Grouped by user story (US1 P1, US2 P2, US3 P3) so each story can be built and checked on its own.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an unfinished task)
- **[Story]**: US1, US2, US3 for story phases only
- Paths are relative to the repository root `/home/topiltzin/paltrain`

## Phase 1: Setup

**Purpose**: Confirm a clean starting point before changes

- [X] T001 Create the directories `content/exercises/`, `src/features/sessions/`, `tests/unit/sessions/`, and `src/app/api/session-plan/` (create each with its first file, since git does not track empty directories)
- [X] T002 Confirm the baseline is green by running `npm test`, `npm run typecheck`, and `npm run lint` in `/home/topiltzin/paltrain`. Stop and report if any fail, since the change would be unverifiable.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared limits, the exercise schema, and the exercise dataset. Every story needs these.

**CRITICAL**: No user story work begins until this phase is complete.

### Session length rules

- [X] T003 [P] Write failing tests in `tests/unit/sessions/session-length.test.ts` (RED). Cases: `targetExerciseCount(10)` is 3, `targetExerciseCount(30)` is 5, `targetExerciseCount(60)` is 7, `targetExerciseCount(90)` is 10; the count never decreases at any 5-minute step from 10 to 90; the constants are MIN_MINUTES 10, MAX_MINUTES 90, STEP_MINUTES 5, DEFAULT_MIN_MINUTES 30, DEFAULT_MAX_MINUTES 60, MIN_EXERCISES 3, MAX_EXERCISES 10.
- [X] T005 Implement `src/features/sessions/session-length.ts` to pass T003 (GREEN). Export the named constants above and `targetExerciseCount(maxMinutes)` = `MIN_EXERCISES + Math.round((maxMinutes - MIN_MINUTES) / (MAX_MINUTES - MIN_MINUTES) * (MAX_EXERCISES - MIN_EXERCISES))`. Depends on T003.
- [X] T007 Update `src/features/library/handle-templates.ts` so its `MIN_MINUTES` and `MAX_MINUTES` come from `src/features/sessions/session-length.ts` instead of local numbers. Depends on T005. Existing tests must still pass.

### Exercise schema

- [X] T004 [P] Write failing tests in `tests/unit/sessions/exercise-schema.test.ts` (RED). Cases: a valid low-intensity exercise parses; a `high` exercise with no `caution` is rejected; `minutes` outside 1 to 30 is rejected; `name` outside 3 to 60 characters is rejected; `equipment` with zero entries is rejected; `moods` with zero or more than 4 entries is rejected; `id` not matching `<focus>-NNN` is rejected.
- [X] T006 Implement `src/features/sessions/exercise.schema.ts` to pass T004 (GREEN). Zod schema with fields `id`, `name`, `focus` (from `focusIds`), `moods` (1 to 4 from `moodIds`), `minutes` (integer 1 to 30), `intensity` (from `intensityLevels`), `equipment` (at least 1 string, `"none"` allowed for bodyweight), `caution` (optional string, required when intensity is `high`). Depends on T004.

### Exercise dataset (one file per focus area, at least 10 exercises each)

Each dataset task: create the file with at least 10 exercises for that focus, every entry valid against `src/features/sessions/exercise.schema.ts`, ids in the form `<focus>-001`, `<focus>-002`, and so on, moods drawn from the mood ids in `src/features/moods/moods.ts`, and `minutes` between 1 and 30. Depends on T006.

- [X] T008 [P] Create `content/exercises/chest.json` with at least 10 exercises for focus `chest`
- [X] T009 [P] Create `content/exercises/biceps.json` with at least 10 exercises for focus `biceps`
- [X] T010 [P] Create `content/exercises/triceps.json` with at least 10 exercises for focus `triceps`
- [X] T011 [P] Create `content/exercises/back.json` with at least 10 exercises for focus `back`
- [X] T012 [P] Create `content/exercises/legs.json` with at least 10 exercises for focus `legs`
- [X] T013 [P] Create `content/exercises/cardio.json` with at least 10 exercises for focus `cardio`
- [X] T014 [P] Create `content/exercises/hyrox-style.json` with at least 10 exercises for focus `hyrox-style`
- [X] T015 [P] Create `content/exercises/conditioning.json` with at least 10 exercises for focus `conditioning`
- [X] T016 [P] Create `content/exercises/calisthenics.json` with at least 10 exercises for focus `calisthenics`
- [X] T017 [P] Create `content/exercises/stretching.json` with at least 10 exercises for focus `stretching`

- [X] T018 Create `src/features/sessions/exercise-content-index.ts` that imports the ten files from T008 to T017 and exports them as `rawExerciseFiles`, following `src/features/library/content-index.ts`. Depends on T008 to T017.
- [X] T019 Write failing tests in `tests/unit/sessions/exercise-library.test.ts` (RED, then GREEN once content exists). Cases: every file parses; every focus has at least 10 exercises; every mood id has at least one exercise; all ids are unique across files. Depends on T018.
- [X] T020 Implement `src/features/sessions/exercise-library.ts` to pass T019. Parse the raw files with the exercise schema, cache the result, and throw an error that carries the cause when parsing fails. Follow `src/features/library/library-repository.ts`. Depends on T019.
- [X] T021 Extend `scripts/validate-content.ts` to check exercise counts per focus (at least 10), mood coverage across exercises, and print the exercise count for each focus area. Depends on T020.

**Checkpoint**: Foundation ready. Exercise data loads and validates, and the length rules are tested.

---

## Phase 3: User Story 1 - Choose a session length range with a bar (Priority: P1) MVP

**Goal**: A user sets a minimum and maximum session length on a two-handle bar and gets a plan whose total time falls inside that range.

**Independent Test**: Open the home screen, set the range to 30 to 45 minutes, pick a mood, release the handle, and confirm the plan's total is between 30 and 45 minutes.

### Tests for User Story 1 (write first, must fail)

- [X] T022 [P] [US1] Write failing tests in `tests/unit/sessions/range.test.ts` (RED) for `clampRange`: moving the minimum above the maximum pushes the maximum up; moving the maximum below the minimum pushes the minimum down; values snap to 5-minute steps; values clamp to 10 and 90.
- [X] T023 [P] [US1] Write failing tests in `tests/unit/sessions/plan-session.test.ts` (RED) for `planSession`, using an injected fixed random function. Cases: the total is between minimum and maximum; no exercise id appears twice; when nothing fits, the result is empty with `partial` true; mood and focus matches come first, and when none exist the fallback to either one sets `partial` true; the same input and random function give the same output.
- [X] T024 [P] [US1] Write failing tests in `tests/integration/api/session-plan.test.ts` (RED) for `POST /api/session-plan`. Cases: an unauthenticated call is rejected with the existing auth error; a non-JSON body returns `INVALID_INPUT` with "Send the request as JSON."; minimum above maximum returns `INVALID_INPUT`; a value outside 10 to 90 or not a multiple of 5 returns `INVALID_INPUT`; neither mood nor focus returns `INVALID_INPUT`; a valid request returns the success envelope with `exercises`, `totalMinutes` inside the range, `targetCount`, `partial`, and `shortfallMessage`.
- [X] T025 [P] [US1] Write failing end-to-end tests in `tests/e2e/session-length.spec.ts` (RED). Cases: the default range text "30 to 60 minutes" is visible; after the maximum handle is moved to 45 and released, the plan total is between 30 and 45.

### Implementation for User Story 1

- [X] T026 [US1] Implement `clampRange` in `src/features/sessions/range.ts` to pass T022 (GREEN). Pure function, no React imports. Depends on T022.
- [X] T027 [US1] Implement `planSession` in `src/features/sessions/plan-session.ts` to pass T023 (GREEN). Steps: filter to exercises matching both mood and focus, falling back to either with `partial` true; shuffle with the injected random function; take exercises while the count is below `targetExerciseCount(max)` and the total stays at or below the maximum; if the total is below the minimum, keep adding fitting exercises ignoring the count target; never repeat an id. Keep each helper under 50 lines. Depends on T023, T005, T020.
- [X] T028 [US1] Implement `toExerciseView` in `src/features/sessions/session-view.ts` that maps an exercise to the API view with `id`, `name`, `focus`, `minutes`, `intensity`, `equipment`, and `caution` (null when absent). Depends on T006.
- [X] T029 [US1] Implement `src/features/sessions/handle-session-plan.ts` to pass T024 (GREEN). Mirror `src/features/suggestions/handle-suggestions.ts`: `requireUser`, JSON check, Zod body schema (min and max within 10 to 90, multiples of 5, min at most max, optional mood and focus, at least one of them), call `planSession` with `loadExerciseLibrary().list()`, return the envelope with `ErrorCodes.INVALID_INPUT` or `LIBRARY_UNAVAILABLE` on failure. Depends on T024, T027, T028, T020.
- [X] T030 [US1] Create `src/app/api/session-plan/route.ts` with a thin `POST` export that calls `handlePostSessionPlan`, matching `src/app/api/suggestions/route.ts`. Depends on T029.
- [X] T031 [P] [US1] Implement `src/components/session-length-range.tsx` (client component). Two `<input type="range">` elements overlaid on one track, pointer events only on the thumbs, `aria-label` "Shortest session" and "Longest session", a live text region (`aria-live="polite"`) showing "X to Y minutes", `onChange` clamps via `clampRange`, and a commit callback on pointer up, key up, or blur. Depends on T026.
- [X] T032 [P] [US1] Implement `src/components/session-plan-list.tsx` (client component) that shows the total minutes and each exercise's name and minutes, with a short empty state that asks the user to pick a mood or muscle group. Depends on T028.
- [X] T033 [US1] Integrate into `src/components/home-experience.tsx`. Add range state (default 30 to 60) and plan state. Mount `SessionLengthRange` after the "How are you feeling?" section. On commit, POST to `/api/session-plan` with the current mood and focus. If neither is picked, show the empty state and send no request. Depends on T031, T032, T030.

**Checkpoint**: User Story 1 works. Run `npx playwright test tests/e2e/session-length.spec.ts` and the unit tests from this phase; they should pass.

---

## Phase 4: User Story 2 - More exercises for longer sessions (Priority: P2)

**Goal**: The exercise count rises with the range: at least 3 at 10 minutes, 10 at 90 minutes, and never falling as length grows.

**Independent Test**: Plan a 10-minute session and confirm at least 3 exercises. Plan a 90-minute session and confirm 10 exercises.

### Tests for User Story 2 (write first, must fail)

- [X] T034 [US2] Add failing tests to `tests/unit/sessions/plan-session.test.ts` (RED) for count scaling with a full library: at maximum 10 the plan has exactly 3 exercises; at maximum 90 it has exactly 10; the count does not decrease at any 5-minute step from 10 to 90; a plan at the shortest length still has at least 3 exercises when the library allows it. Depends on T023.
- [X] T035 [US2] Add failing integration tests to `tests/integration/api/session-plan.test.ts` (RED): for the same mood and focus, a 90-minute range returns more exercises than a 10-minute range. Depends on T024.
- [X] T036 [US2] Add failing end-to-end tests to `tests/e2e/session-length.spec.ts` (RED): a 10 to 10 range shows at least 3 exercises or the shortfall message; a 10 to 90 range with a mood shows up to 10 exercises with a total at most 90. Depends on T025.

### Implementation for User Story 2

- [X] T037 [US2] Update `src/features/sessions/plan-session.ts` so the count target applies before the minimum top-up, and the minimum of 3 exercises is enforced when the library allows. Passes T034 (GREEN). Depends on T034, T027.
- [X] T038 [US2] Add the shortfall message in `src/features/sessions/plan-session.ts`: "Only N exercises fit between X and Y minutes. Try a wider range." It is set whenever `partial` is true for a length reason. Pass T035 and T036 (GREEN). Depends on T037, T029.

**Checkpoint**: User Stories 1 and 2 both work. The count scales as the spec requires.

---

## Phase 5: User Story 3 - See what the session contains (Priority: P3)

**Goal**: Each exercise shows its name, minutes, equipment, and any caution, and the minutes add up to the total.

**Independent Test**: Plan a session and check that each row shows name, minutes, and equipment, that the high-intensity row shows its caution, and that the minutes sum to the total.

### Tests for User Story 3 (write first, must fail)

- [X] T039 [US3] Write failing tests in `tests/unit/sessions/session-view.test.ts` (RED): `toExerciseView` keeps the `equipment` array; a high-intensity exercise keeps its `caution` text; a summed minutes helper over a plan equals `totalMinutes`. Depends on T028.
- [X] T041 [US3] Add failing end-to-end tests to `tests/e2e/session-length.spec.ts` (RED): each exercise row shows its name, minutes, and equipment; a high-intensity row shows its caution; the visible minutes add up to the displayed total. Depends on T036.

### Implementation for User Story 3

- [X] T040 [US3] Update `src/features/sessions/session-view.ts` to pass T039 (GREEN): keep `equipment`, keep `caution` for high-intensity exercises, and export the minutes sum helper used by `planSession`. Depends on T039.
- [X] T042 [US3] Update `src/components/session-plan-list.tsx` to show equipment and caution text for each exercise and to show the sum that matches the total. Passes T041 (GREEN). Depends on T041, T040, T032.

**Checkpoint**: All three user stories work independently and together.

---

## Final Phase: Polish & Cross-Cutting Concerns

- [X] T043 Run `npm run test:coverage` and add unit tests until files under `src/features/sessions/` reach at least 80% line coverage (constitution Principle II).
- [ ] T044 [P] Check `src/components/session-length-range.tsx` for accessibility: arrow keys step 5 minutes, each handle has its label and value announced, the focus outline is visible, and the text meets 4.5:1 contrast against its background.
- [ ] T045 [P] Extend `tests/e2e/phone-layout.spec.ts` with a 375 px check that the session length bar and the plan list fit without horizontal scrolling.
- [ ] T046 Run a security review of `POST /api/session-plan` in `src/features/sessions/handle-session-plan.ts` with the security-reviewer agent. Fix any CRITICAL or HIGH finding before merge.
- [ ] T047 Run the full checklist in `specs/003-session-length-range/quickstart.md` (`npm run validate:content`, `npm run typecheck`, `npm run lint`, `npm test`, `npm run test:coverage`, `npm run build`, `npm run test:e2e`) and confirm every command passes.

---

## Dependencies & Execution Order

### Phase dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup. Blocks all user stories.
- **User Story 1 (Phase 3)**: Depends on Foundational. This is the MVP.
- **User Story 2 (Phase 4)**: Depends on US1 tasks T023, T024, T025, and T027 (it extends the planner and the API tests).
- **User Story 3 (Phase 5)**: Depends on US1 tasks T028, T032, and T036 (it extends the view, list, and e2e file).
- **Polish (Final)**: Depends on all stories.

### Within each story

- Tests are written first and must fail (RED) before the implementation task that follows them.
- Pure logic (range, planner, view) before the route, the route before the UI, the UI before the e2e check passes.

### Shared-file notes

- `tests/unit/sessions/plan-session.test.ts`, `tests/integration/api/session-plan.test.ts`, and `tests/e2e/session-length.spec.ts` are each edited by several tasks across stories, so those tasks are not marked [P].
- `src/features/sessions/plan-session.ts` changes in T027, T037, and T038.

### Parallel opportunities

- T003 and T004 (different test files)
- T008 to T017 (ten separate content files)
- T022, T023, T024, and T025 (different test files, after Foundational)
- T031 and T032 (different components)
- T044 and T045 (different files)

**Parallel example, User Story 1 tests**:

```text
Task: T022 tests/unit/sessions/range.test.ts
Task: T024 tests/integration/api/session-plan.test.ts
Task: T025 tests/e2e/session-length.spec.ts
```

---

## Implementation Strategy

### MVP first (User Story 1 only)

1. Phase 1 Setup
2. Phase 2 Foundational
3. Phase 3 User Story 1
4. Stop and validate with quickstart.md section 2, steps 1 to 6

### Incremental delivery

1. Foundation, then US1 (MVP: the bar and a plan inside the range)
2. US2 (exercise count scaling)
3. US3 (exercise details and the sum check)
4. Polish (coverage, accessibility, phone layout, security review)

---

## Notes

- Content authoring (T008 to T017) is the largest share of work. Each file needs at least 10 exercises, which is the minimum to reach 10 exercises at 90 minutes in most focus areas.
- Commit after each task or logical group, using Conventional Commits (`feat:`, `test:`, `chore:`). The repo commits directly to `main`.
