# Tasks: Swap an Exercise for Another of the Same Type

**Input**: Design documents from `/specs/012-exercise-swap/`

**Prerequisites**: [plan.md](plan.md) (required), [spec.md](spec.md) (required), [research.md](research.md), [data-model.md](data-model.md), [contracts/exercise-alternatives-api.md](contracts/exercise-alternatives-api.md), [quickstart.md](quickstart.md)

**Tests**: Included. Constitution Principle II makes test-first development mandatory, and the plan commits to it. Pure rules and the endpoint are tested with Vitest. Card and options behavior is tested end to end with Playwright, because Vitest's unit config excludes `src/components/**`.

**Organization**: Tasks are grouped by user story so each story can be built and tested on its own.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an unfinished task)
- **[Story]**: The user story the task serves (US1, US2, US3)
- Every description names the exact file path

## Constraints quoted from data-model.md and the contract

These apply wherever a task says "validate the range" or "validate the ids":

- `minMinutes` and `maxMinutes`: integers from `SLIDER_MIN_MINUTES` (0) to `MAX_MINUTES` (90), in `STEP_MINUTES` (5) steps, with min not above max.
- `currentExerciseIds`: 1 to `MAX_EXERCISES` (15) library ids, and must include `exerciseId`.
- `exerciseId`: must match an id in the library.
- Exercise fields (existing schema): `name` 3 to 60 characters; `description` up to 200 characters; `minutes` integer 1 to 30; `intensity` one of low, moderate, high.

---

## Phase 1: Setup

**Purpose**: Establish a known baseline before any change.

- [ ] T001 Run `npm run typecheck`, `npm run lint`, and `npm test` on the untouched tree (`package.json`) and record any failures before starting, so later failures can be told apart from existing ones

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The shared rules and the shared demo lookup that every story uses. No story work starts until this phase is done.

**CRITICAL**: No user story work can begin until this phase is complete.

- [X] T002 [P] Write failing unit test in `tests/unit/demos/attach-active-demos.test.ts`: attaches each exercise's active demo by id; sets `demo: null` for exercises without a link; when the lookup throws, logs the error and returns every exercise with `demo: null` instead of failing
- [X] T003 Create `src/features/demos/attach-active-demos.ts` exporting `attachActiveDemos(exercises, demoLinks, libraryIds)`, moved unchanged from `src/features/sessions/handle-session-plan.ts`; change `src/features/sessions/handle-session-plan.ts` to import it; make T002 pass; run the existing `tests/integration/api/session-plan.test.ts` to confirm no behavior change
- [X] T004 [P] Write failing unit test in `tests/unit/sessions/swap-alternatives.test.ts`: returns only exercises with the same `focus`; never includes the card's own id or any id in `currentIds`; returns options in library order; marks an option `available: false` with reason `over_length` when the total after the swap is above `maxMinutes` or below `minMinutes`; keeps an option available when the total lands exactly on `maxMinutes` or on `minMinutes`; returns an empty list when no other same-focus exercise exists
- [X] T005 Create `src/features/sessions/swap-alternatives.ts` exporting `swapOptionsFor(library, exerciseId, currentIds, range)` that returns `SwapOption` values (defined in T006) computed from library minutes, not client input; make T004 pass; name the reason as the constant `OVER_LENGTH_REASON` exported from this file
- [X] T006 [P] Add `SwapOption` and `SwapAlternatives` types to `src/features/sessions/session-view.ts`, matching data-model.md: `SwapOption` has `exercise: ExerciseView`, `available: boolean`, `unavailableReason: "over_length" | null`; `SwapAlternatives` has `exerciseId: string`, `focus: FocusId`, `options: SwapOption[]`

**Checkpoint**: Shared rules and demo lookup are tested and in place. Story work can start.

---

## Phase 3: User Story 1 - Swap an exercise for another of the same muscle group (Priority: P1) MVP

**Goal**: Each plan card has a swap control. Activating it replaces that card with another same-type exercise not already in the plan, keeps the plan's order, updates total minutes, and cycles through alternatives on repeated swaps. Swaps are disabled while the workout timer runs.

**Independent Test**: Generate a plan containing a biceps exercise. Swap "Barbell curl" and confirm the new card is a different biceps exercise, other cards are unchanged, the total updates, and swapping again moves to a different biceps exercise (see quickstart.md steps 2 to 3).

### Tests for User Story 1 (write first, confirm they fail)

- [X] T007 [US1] Write failing integration tests in `tests/integration/api/exercise-alternatives.test.ts`, following `tests/integration/api/session-plan.test.ts`: 200 returns same-focus options that exclude the plan's ids, in library order; a signed-out request is refused; a non-JSON body returns INVALID_INPUT "Send the request as JSON."; an `exerciseId` not in the library returns INVALID_INPUT; an `exerciseId` not in `currentExerciseIds` returns INVALID_INPUT with "Swap an exercise that is in the plan."; a failing demo lookup still returns 200 with `demo: null` (FR-011)
- [X] T008 [P] [US1] Write failing unit test in `tests/unit/sessions/swap-cursor.test.ts`: returns the first available option after the last index; wraps to the start after the last option; skips unavailable options; returns `null` when no option is available; when two or more options are available, never returns the same option twice in a row
- [X] T009 [P] [US1] Write failing unit test in `tests/unit/sessions/replace-plan-exercise.test.ts`: replaces only the entry at the target id, keeping its position; other entries and their order are unchanged; `totalMinutes` equals the sum of the new minutes; the input plan is not mutated; an id not in the plan returns the same plan
- [X] T010 [P] [US1] Write failing test in `tests/unit/analytics/event-catalog.test.ts`: `"exercise swapped"` is a valid event name, and its data accepts only `exerciseId` and `focus` as string values
- [X] T011 [US1] Write failing Playwright scenarios in `tests/e2e/exercise-swap.spec.ts` using the `signIn` helper from `tests/e2e/helpers/sign-in.ts`: (a) swapping "Barbell curl" shows a different biceps card and leaves the other cards unchanged; (b) repeated swaps never show the same exercise twice in a row; (c) swap controls are disabled while the workout timer is running and say why. The file skips with the helper's reason when credentials are unset.

### Implementation for User Story 1

- [X] T012 [US1] Create `src/features/sessions/handle-exercise-alternatives.ts` exporting `handlePostExerciseAlternatives(request, getSession?, demoLinks?)`: follow `src/features/sessions/handle-session-plan.ts` for `requireUser`, the JSON check, `readJsonBody`, and error responses; validate the body with zod using the constraints quoted above; compute options with `swapOptionsFor` (T005); attach demos with `attachActiveDemos` (T003); return `ok(...)` with the contract's shape; make T007 pass
- [X] T013 [US1] Create `src/app/api/exercise-alternatives/route.ts` exporting `POST(request)` that delegates to `handlePostExerciseAlternatives`, matching `src/app/api/session-plan/route.ts`
- [X] T014 [P] [US1] Create `src/features/sessions/swap-cursor.ts` exporting `nextAvailableOption(options, lastIndex)` returning `{ option, index }` or `null`; make T008 pass
- [X] T015 [P] [US1] Create `src/features/sessions/replace-plan-exercise.ts` exporting `replacePlanExercise(plan, exerciseId, replacement)` that returns a new plan object with the entry replaced and `totalMinutes` recomputed with `sumMinutes` from `src/features/sessions/session-view.ts`; make T009 pass
- [X] T016 [P] [US1] Add `"exercise swapped"` to `EVENT_CATALOG` in `src/features/analytics/event-catalog.ts` with data keys `exerciseId` and `focus` only; make T010 pass
- [X] T017 [US1] Add optional `onRunningChange?: (running: boolean) => void` to `WorkoutTimer` in `src/components/workout-timer.tsx`, called whenever the running state changes; keep the existing behavior when the prop is absent
- [X] T018 [US1] Create `src/components/exercise-card.tsx` with the same surface, padding, and typography as the plan row in `src/components/session-plan-list.tsx` (`rounded-2xl bg-surface px-4 py-3`); show name, minutes, description, equipment, caution, and demo button as today; add a swap button with accessible name `Swap <exercise name>` (phosphor icon, `aria-hidden`); disable it when `swapDisabledReason` is set, showing that reason as text; show "No other exercises for this muscle group." when the options list is empty
- [X] T019 [US1] Update `src/components/session-plan-list.tsx` to render `ExerciseCard` for each plan entry and pass through `onSwap(exerciseId)` and `swapDisabledReason`; keep the existing `data-testid` attributes
- [X] T020 [US1] Update `src/components/session-planner.tsx`: hold the plan in state; on swap, POST to `/api/exercise-alternatives` with the plan's ids and the committed range; keep a swap cursor per card (T014); apply `replacePlanExercise` (T015); track `"exercise swapped"` (T016); hold `timerRunning` from `WorkoutTimer`'s `onRunningChange` (T017); clear cursors when a new plan is generated. If any function passes 50 lines, move the fetch and cursor logic into `src/components/use-exercise-swaps.ts`.
- [ ] T021 [US1] Run `tests/e2e/exercise-swap.spec.ts` scenarios (a) to (c) until they pass; with credentials set, run `npm run test:e2e -- tests/e2e/exercise-swap.spec.ts`

**Checkpoint**: User Story 1 works on its own. The MVP is ready to demo.

---

## Phase 4: User Story 2 - Choose the replacement from a list of same-type options (Priority: P2)

**Goal**: A "Choose another" control on each card opens a list of same-type options showing name, minutes, equipment, and intensity. Choosing one replaces the card, closes the list, and returns focus to the card. Closing without choosing leaves the card unchanged.

**Independent Test**: Open the options for "Barbell curl". Confirm every option is biceps, "Barbell curl" is not listed, each option shows equipment, and choosing "Hammer curl" replaces the card and returns focus to it (quickstart.md step 4).

### Tests for User Story 2 (write first, confirm they fail)

- [X] T022 [P] [US2] Add failing Playwright scenarios to `tests/e2e/exercise-swap.spec.ts`: (a) opening options lists name, minutes, equipment, and intensity for each option, and "Barbell curl" is absent; (b) choosing "Hammer curl" replaces the card, closes the list, and moves focus to the card's "Choose another" button; (c) closing the list without choosing leaves the card unchanged

### Implementation for User Story 2

- [X] T023 [US2] Create `src/components/exercise-swap-options.tsx` listing options as buttons, each showing name, minutes, equipment, and intensity; a close button; a fade through `motion/react` that is instant when `useReducedMotion()` is true; no state for the list beyond what the card passes in
- [X] T024 [US2] Update `src/components/exercise-card.tsx` to add a "Choose another" button that opens and closes `ExerciseSwapOptions`; on choose, call `onChoose(option)` and return focus to the trigger; on close, return focus to the trigger
- [X] T025 [US2] Update `src/components/session-planner.tsx` (reusing the fetch from T020, not a second copy) to load options when the list opens and apply the chosen option through `replacePlanExercise`
- [ ] T026 [US2] Run `tests/e2e/exercise-swap.spec.ts` scenarios from T022 until they pass

**Checkpoint**: User Stories 1 and 2 both work independently.

---

## Phase 5: User Story 3 - Keep the workout within its length and count limits (Priority: P3)

**Goal**: A swap never pushes the total outside the chosen minimum and maximum. Options that would break the range show as unavailable with a short reason. Range input to the endpoint is validated.

**Independent Test**: Build a plan at its maximum length. Confirm options that would go over are disabled with a reason, and options that fit still swap (quickstart.md steps 2 and 4).

### Tests for User Story 3 (write first, confirm they fail)

- [X] T027 [US3] Add failing cases to `tests/integration/api/exercise-alternatives.test.ts`: an option that would push the total above `maxMinutes` returns `available: false` with `unavailableReason: "over_length"`; a plan already at `maxMinutes` returns no available options; `minMinutes` or `maxMinutes` outside 0 to 90, not a multiple of 5, or with min above max returns INVALID_INPUT
- [X] T028 [P] [US3] Add failing Playwright scenario to `tests/e2e/exercise-swap.spec.ts`: with a plan at the maximum length, over-length options are disabled and show the reason text, and an option that fits can still be chosen

### Implementation for User Story 3

- [X] T029 [US3] Verify `src/features/sessions/handle-exercise-alternatives.ts` (T012) enforces the range constraints quoted above and returns `available` and `unavailableReason` from `swapOptionsFor`; fix it where T027 fails
- [X] T030 [US3] Add a named constant for the reason text in `src/features/sessions/swap-alternatives.ts` (for example `OVER_LENGTH_TEXT`, built from `maxMinutes`, such as "Would go over your 60-minute limit"); pass `maxMinutes` into `src/components/exercise-swap-options.tsx` and render the text on each unavailable option, which is disabled
- [X] T031 [US3] Run the T028 scenario until it passes, and confirm T027 passes with `npm run test:integration`

**Checkpoint**: All three stories work independently.

---

## Final Phase: Polish & Cross-Cutting Concerns

**Purpose**: Quality gates from the constitution and the manual checks in quickstart.md.

- [ ] T032 [P] Run `npm run typecheck`, `npm run lint`, and `npm run test:coverage`; confirm changed `src/**/*.ts` files are at or above 80% coverage (`vitest.config.ts`)
- [ ] T033 [P] Check Principle I in changed files: functions under 50 lines, nesting at most 4 levels, no `console.log` in committed code; split `src/components/session-planner.tsx` into `src/components/use-exercise-swaps.ts` if it has grown past the limits
- [ ] T034 Run the manual checks in quickstart.md steps 5 to 8: timer lock, phone width (about 390px) with no horizontal scroll, reduced motion removes the fade, and keyboard-only operation with accessible names
- [X] T035 [P] Re-check the test ids the existing e2e tests use (`session-total`, `exercise-minutes`, `exercise-description`, `exercise-equipment`, `exercise-caution`) still render after the card extraction in T018 and T019; update `tests/e2e/` selectors only if the text changed

---

## Dependencies & Execution Order

### Phase dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup. Blocks all user stories. T003 and T005 are needed by every story.
- **User Stories (Phases 3 to 5)**: All depend on Foundational. US1 is the MVP. US2 reuses the fetch and card from US1 (T020, T018), so it starts after US1. US3 changes the endpoint (T012) and the options list (T023), so it starts after US2.
- **Polish (Final)**: Depends on the stories being complete.

### Within each story

- Tests first (confirm they fail), then implementation, then the e2e check.
- Models and rules (`swap-cursor`, `replace-plan-exercise`, `swap-alternatives`) before the endpoint and UI.
- The endpoint (T012, T013) before the planner (T020) that calls it.

### Parallel opportunities

- Phase 2: T002 and T004 can be written in parallel; T006 is independent of both.
- Phase 3: T008, T009, T010 can be written in parallel. T014, T015, T016 can be implemented in parallel once their tests exist.
- Phase 4: T022 is independent of the component work.
- Phase 5: T028 can be written while T027 is written.

---

## Parallel Example: User Story 1

```text
# Tests together:
T008 tests/unit/sessions/swap-cursor.test.ts
T009 tests/unit/sessions/replace-plan-exercise.test.ts
T010 tests/unit/analytics/event-catalog.test.ts

# Implementation together, after their tests fail:
T014 src/features/sessions/swap-cursor.ts
T015 src/features/sessions/replace-plan-exercise.ts
T016 src/features/analytics/event-catalog.ts
```

---

## Implementation Strategy

### MVP first (User Story 1 only)

1. Phase 1 and Phase 2
2. Phase 3 (US1)
3. Stop and check: a swap on "Barbell curl" gives a different biceps card, the total updates, and repeated swaps cycle

### Incremental delivery

1. Foundation plus US1: MVP, demo swap
2. Add US2: choose from the options list
3. Add US3: length limits and unavailable options
4. Polish: quality gates and manual checks

---

## Notes

- Each story's test tasks come before its implementation tasks. Confirm the tests fail first.
- The e2e file skips without `E2E_USER_EMAIL` and `E2E_USER_PASSWORD`. Those scenarios run only with credentials set, so the component behavior is not verified in an environment without them.
- This project is a single Next.js app, so the plan's single-project layout applies.
- Commit after each task or small group, using Conventional Commits (`feat`, `test`, `refactor`) per the constitution.
