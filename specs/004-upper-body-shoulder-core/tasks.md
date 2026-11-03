# Tasks: Upper Body, Shoulder, and Core Options

**Input**: Design documents from `specs/004-upper-body-shoulder-core/` (plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md)

**Tests**: Included. Constitution Principle II requires test-first development. Each test task says it must fail before its implementation task runs.

**Organization**: Grouped by user story (US1 P1, US2 P2, US3 P3) so each story can be checked on its own.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an unfinished task)
- **[Story]**: US1, US2, US3 for story phases only
- Paths are relative to the repository root `/home/topiltzin/paltrain`

## Phase 1: Setup

**Purpose**: Confirm a clean starting point and create the empty content files the imports need.

- [X] T001 Confirm the baseline is green by running `npm test`, `npm run typecheck`, `npm run lint`, and `npm run validate:content` in `/home/topiltzin/paltrain`. Stop and report if any fail.
- [X] T002 Create six placeholder files, each containing `[]`: `content/templates/upper-body.json`, `content/templates/shoulders.json`, `content/templates/core.json`, `content/exercises/upper-body.json`, `content/exercises/shoulders.json`, `content/exercises/core.json`. `validate:content` will fail on purpose until the content tasks fill them.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The three focus ids must exist before any story can use them.

**CRITICAL**: No user story work begins until this phase is complete.

- [X] T003 [P] Write failing tests in `tests/unit/library/focus-areas.test.ts` (RED). Cases: the focus list has 13 entries; the new ids are `upper-body`, `shoulders`, `core` with labels "Upper body", "Shoulders", "Core"; they come after `stretching`; every id is unique.
- [X] T004 Add `upper-body`, `shoulders`, and `core` to `focusIds` and add matching entries to `focusAreas` in `src/features/library/focus-areas.ts` to pass T003 (GREEN). Descriptions as in plan.md Design Notes. Depends on T003.
- [X] T005 [P] Update `tests/integration/api/focus-areas.test.ts` to expect 13 focus areas instead of 10 (RED until T004 is done, then GREEN). Depends on T004.
- [X] T006 Register `content/templates/upper-body.json`, `content/templates/shoulders.json`, and `content/templates/core.json` in `src/features/library/content-index.ts`. Depends on T002.
- [X] T007 Register `content/exercises/upper-body.json`, `content/exercises/shoulders.json`, and `content/exercises/core.json` in `src/features/sessions/exercise-content-index.ts`. Depends on T002.

**Checkpoint**: The three ids exist and both content indexes load their files.

---

## Phase 3: User Story 1 - Pick upper body, shoulders, or core from the menu (Priority: P1) MVP

**Goal**: The muscle group menu shows the three new options, and each returns routines for its own area.

**Independent Test**: Sign in, tap each new option, and confirm each shows only routines for that area.

### Tests for User Story 1 (write first, must fail)

- [X] T008 [P] [US1] Write failing integration tests in `tests/integration/api/suggestions-new-areas.test.ts` (RED). Cases: `POST /api/suggestions` with `focus: "shoulders"` and no mood returns only routines whose `focus` is `shoulders`; with `focus: "core"` and `mood: "calm"` returns only core routines, or sets `partial` true if none match the mood.
- [X] T009 [P] [US1] Write failing end-to-end tests in `tests/e2e/focus-menu.spec.ts` (RED). Cases: "Upper body", "Shoulders", and "Core" appear in the muscle group menu after "Stretching"; tapping "Shoulders" with no mood shows only shoulder routines. Skip without `E2E_USER_EMAIL` and `E2E_USER_PASSWORD`.

### Content for User Story 1

Each routine file: 8 to 12 routines, at least 2 at each intensity level, every routine with exactly one `focus` for its area, `duration_minutes` 10 to 90, `moods` 1 to 4 valid mood ids, `equipment` at least one entry, `description` 1 to 300 characters, and `caution` required when `intensity` is `high`. Ids follow `<focus>-NNN`.

- [X] T010 [P] [US1] Fill `content/templates/shoulders.json` with 8 to 12 routines for focus `shoulders` (deltoid and rotator-cuff work), meeting the rules above.
- [X] T011 [P] [US1] Fill `content/templates/upper-body.json` with 8 to 12 routines for focus `upper-body` (pressing and pulling for arms and torso, not chest or back specific), meeting the rules above.
- [X] T012 [P] [US1] Fill `content/templates/core.json` with 8 to 12 routines for focus `core` (trunk stability, bracing, rotation), meeting the rules above.
- [X] T013 [P] [US1] Fill `content/exercises/shoulders.json` with at least 10 exercises for focus `shoulders`, each valid against `src/features/sessions/exercise.schema.ts` (`minutes` 1 to 30, `caution` required for `high`).
- [X] T014 [P] [US1] Fill `content/exercises/upper-body.json` with at least 10 exercises for focus `upper-body`, each valid against `src/features/sessions/exercise.schema.ts`.
- [X] T015 [P] [US1] Fill `content/exercises/core.json` with at least 10 exercises for focus `core`, each valid against `src/features/sessions/exercise.schema.ts`.

### Implementation for User Story 1

- [X] T016 [US1] Verify `src/components/focus-picker.tsx` renders every entry of `focusAreas` from props with no hardcoded list. Make T009 pass (GREEN). If the 13 options do not fit a 320 px phone without horizontal scroll, change only the picker's layout classes so options wrap. Depends on T004, T009.
- [X] T017 [US1] Make T008 pass (GREEN). Confirm `src/features/suggestions/select-suggestions.ts` and `src/features/suggestions/handle-suggestions.ts` use no hardcoded focus list. Fix any that do. Depends on T008, T006, T010, T011, T012.

**Checkpoint**: User Story 1 works. Unit and integration tests for this phase pass.

---

## Phase 4: User Story 2 - Browse each new area in the library (Priority: P2)

**Goal**: The library page for each new area filters by intensity and maximum length.

**Independent Test**: Open the shoulders library, filter to moderate intensity and 30 minutes or less, and confirm every result matches both.

### Tests for User Story 2 (write first, must fail)

- [X] T018 [P] [US2] Write failing unit tests in `tests/unit/library/browse-new-focus.test.ts` (RED). Cases: `browseTemplates` for focus `shoulders` with intensity `moderate` and maximum 30 minutes returns only routines matching both; `loadLibrary().byFocus` returns a non-empty list for each new id.
- [X] T019 [P] [US2] Write failing end-to-end tests in `tests/e2e/library-new-areas.spec.ts` (RED). Cases: `/library/shoulders` opens; choosing intensity "moderate" and "30 min" leaves only matching routines. Skip without credentials.

### Implementation for User Story 2

- [X] T020 [US2] Make T018 pass (GREEN). Check `src/features/library/browse-templates.ts` and `src/components/template-filters.tsx` for hardcoded focus lists. Fix any found. Depends on T018, T006, T010, T011, T012.
- [X] T021 [US2] Make T019 pass (GREEN). Confirm `src/app/(app)/library/[focus]/page.tsx` and `src/app/(app)/library/[focus]/[id]/page.tsx` resolve the new ids through `focusAreas`, and that unknown ids still return not found. Depends on T019, T004, T006.

**Checkpoint**: User Stories 1 and 2 both work.

---

## Phase 5: User Story 3 - Each routine states its level clearly (Priority: P3)

**Goal**: Routine pages show "Low", "Moderate", or "High" with a one-line meaning, every high routine shows its caution, and existing routines are checked against the rubric.

**Independent Test**: Open a high-intensity routine and confirm its level, its meaning, and its caution are visible on the same screen.

### Tests for User Story 3 (write first, must fail)

- [X] T022 [P] [US3] Write failing unit tests in `tests/unit/library/intensity-label.test.ts` (RED). Cases: `intensityLabel("low")` is "Low", `"moderate"` is "Moderate", `"high"` is "High"; each level has a non-empty one-line meaning with no em-dash; the high meaning mentions effort or risk.
- [X] T023 [P] [US3] Write failing end-to-end tests in `tests/e2e/routine-level.spec.ts` (RED). Cases: a high-intensity routine shows "High" and a caution on the same page; a low-intensity routine shows "Low". Skip without credentials.

### Implementation for User Story 3

- [X] T024 [US3] Create `src/features/library/intensity-label.ts` exporting `intensityLabel(level)` and `intensityMeaning(level)` to pass T022 (GREEN). Depends on T022.
- [X] T025 [US3] Update `src/app/(app)/library/[focus]/[id]/page.tsx` to show `intensityLabel` and `intensityMeaning` instead of the raw value, next to the existing caution, to pass T023 (GREEN). Depends on T023, T024.
- [X] T026 [US3] Create `specs/004-upper-body-shoulder-core/level-check.md` with a header and an empty table: columns `item_id`, `kind`, `previous_level`, `assigned_level`, `reason`, `changed`, `needs_review`. Include the rubric from research.md at the top. Depends on T001.

### Level check of existing routines (sequential: all tasks write to the same record file)

Rubric: low is mobility, recovery, or controlled work with no load above light and no explosive movement; moderate is loaded or steady work with no maximal effort; high is heavy, maximal, explosive, or high-risk work and needs a caution.

For each file, add one row per entry to `level-check.md`. Change a level only where it disagrees with the rubric, set `changed` true and `needs_review` true for those rows, and state the reason in one sentence. Do not run these in parallel.

- [X] T027 [US3] Level-check `content/templates/chest.json`: one record per routine, correct levels where needed, in `specs/004-upper-body-shoulder-core/level-check.md`. Depends on T026.
- [X] T028 [US3] Level-check `content/templates/biceps.json` in `specs/004-upper-body-shoulder-core/level-check.md`. Depends on T027.
- [X] T029 [US3] Level-check `content/templates/triceps.json` in `specs/004-upper-body-shoulder-core/level-check.md`. Depends on T028.
- [X] T030 [US3] Level-check `content/templates/back.json` in `specs/004-upper-body-shoulder-core/level-check.md`. Depends on T029.
- [X] T031 [US3] Level-check `content/templates/legs.json` in `specs/004-upper-body-shoulder-core/level-check.md`. Depends on T030.
- [X] T032 [US3] Level-check `content/templates/cardio.json` in `specs/004-upper-body-shoulder-core/level-check.md`. Depends on T031.
- [X] T033 [US3] Level-check `content/templates/hyrox-style.json` in `specs/004-upper-body-shoulder-core/level-check.md`. Depends on T032.
- [X] T034 [US3] Level-check `content/templates/conditioning.json` in `specs/004-upper-body-shoulder-core/level-check.md`. Depends on T033.
- [X] T035 [US3] Level-check `content/templates/calisthenics.json` in `specs/004-upper-body-shoulder-core/level-check.md`. Depends on T034.
- [X] T036 [US3] Level-check `content/templates/stretching.json` in `specs/004-upper-body-shoulder-core/level-check.md`. Depends on T035.
- [X] T037 [US3] Level-check `content/exercises/chest.json` in `specs/004-upper-body-shoulder-core/level-check.md`. Depends on T036.
- [X] T038 [US3] Level-check `content/exercises/biceps.json` in `specs/004-upper-body-shoulder-core/level-check.md`. Depends on T037.
- [X] T039 [US3] Level-check `content/exercises/triceps.json` in `specs/004-upper-body-shoulder-core/level-check.md`. Depends on T038.
- [X] T040 [US3] Level-check `content/exercises/back.json` in `specs/004-upper-body-shoulder-core/level-check.md`. Depends on T039.
- [X] T041 [US3] Level-check `content/exercises/legs.json` in `specs/004-upper-body-shoulder-core/level-check.md`. Depends on T040.
- [X] T042 [US3] Level-check `content/exercises/cardio.json` in `specs/004-upper-body-shoulder-core/level-check.md`. Depends on T041.
- [X] T043 [US3] Level-check `content/exercises/hyrox-style.json` in `specs/004-upper-body-shoulder-core/level-check.md`. Depends on T042.
- [X] T044 [US3] Level-check `content/exercises/conditioning.json` in `specs/004-upper-body-shoulder-core/level-check.md`. Depends on T043.
- [X] T045 [US3] Level-check `content/exercises/calisthenics.json` in `specs/004-upper-body-shoulder-core/level-check.md`. Depends on T044.
- [X] T046 [US3] Level-check `content/exercises/stretching.json` in `specs/004-upper-body-shoulder-core/level-check.md`. Depends on T045.

**Checkpoint**: Every routine and exercise is recorded, changes are flagged, and routine pages show the level.

---

## Final Phase: Polish & Cross-Cutting Concerns

- [X] T047 Enable the per-focus minimums in `scripts/validate-content.ts`: at least 2 routines at each intensity level and at least 10 exercises for every focus area. Run `npm run validate:content` and confirm it passes. Depends on T046, T010 to T015.
- [X] T048 [P] Add a failing test to `tests/e2e/phone-layout.spec.ts` (RED): the muscle group menu has no horizontal scroll at 320 px with 13 options. Then make it pass (GREEN) through T016 if needed. Depends on T016.
- [X] T049 Run `npm run test:coverage` and add unit tests until `src/features/library/intensity-label.ts` and the other changed library files reach at least 80% line coverage (constitution Principle II).
- [X] T050 Run the full checklist in `specs/004-upper-body-shoulder-core/quickstart.md` (`npm run validate:content`, `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, `npm run test:e2e`) and confirm each passes or is explained.

---

## Dependencies & Execution Order

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup. Blocks all stories.
- **US1 (Phase 3)**: Depends on Foundational. This is the MVP.
- **US2 (Phase 4)**: Depends on Foundational and on the US1 content tasks (T010 to T012).
- **US3 (Phase 5)**: Routine label work (T022 to T025) depends only on Foundational. The level check (T026 to T046) is sequential and depends on T001.
- **Polish (Final)**: Depends on all stories.

### Shared-file notes

- T027 to T046 all write `level-check.md` and must run one at a time.
- T016 and T048 both touch `tests/e2e/phone-layout.spec.ts` or the picker layout, so T048 waits for T016.
- T006 and T007 each edit one index file, and both wait on T002.

### Parallel opportunities

- T003 and T005 (different test files, after T002)
- T008 and T009 (different test files)
- T010 to T015 (six different content files)
- T018 and T019 (different test files)
- T022 and T023 (different test files)

**Parallel example, User Story 1 content**:

```text
Task: T010 content/templates/shoulders.json
Task: T011 content/templates/upper-body.json
Task: T012 content/templates/core.json
Task: T013 content/exercises/shoulders.json
Task: T014 content/exercises/upper-body.json
Task: T015 content/exercises/core.json
```

---

## Implementation Strategy

### MVP first (User Story 1 only)

1. Phase 1 Setup
2. Phase 2 Foundational
3. Phase 3 User Story 1 (the three options, with routines and exercises)
4. Stop and validate with quickstart.md section 3, steps 2 to 3

### Incremental delivery

1. Foundation, then US1 (MVP: menu options and routines)
2. US2 (library browsing for the new areas)
3. US3 (level labels on routine pages, then the level check of existing content)
4. Polish (per-level minimums, phone width, coverage, full run)

---

## Notes

- The level check (T027 to T046) reads about 127 routines and 100 exercises. Each task covers one file.
- Corrections in the level check change what users see (a moderate routine may become high and gain a caution). Review each `needs_review` row before merging.
- Commit after each task or logical group, using Conventional Commits (`feat:`, `test:`, `chore:`). The repo commits directly to `main`.
