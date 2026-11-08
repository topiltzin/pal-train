# Tasks: Workout Timer with Finish Celebration

**Input**: Design documents from `/specs/009-workout-timer/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/, quickstart.md

**Tests**: Included. The constitution (Principle II) requires test-first development. Pure logic gets unit tests; the flows get end-to-end tests with the browser clock.

**Organization**: Tasks are grouped by user story (US1 timer and chime, US2 Finish and celebration, US3 Stop and Reset). US2 and US3 extend the component built in US1.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: US1, US2, or US3 (setup, foundational, and polish tasks have no story label)
- Exact file paths in every description

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Make the end-to-end tests runnable.

- [X] T001 Install the Playwright browser used by the end-to-end tests with `npx playwright install chromium` (no project file changes)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The pure timer logic that every story uses: the state reducer and the time formatter.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T002 [P] Write failing unit tests in `tests/unit/timer/format.test.ts` for the rule in `data-model.md`: whole seconds round up so the display never reads `0:00` early (for example 9,001 ms shows `9:01`, 42,000 ms shows `0:42`, 0 ms shows `0:00`), and the output is `m:ss` with two-digit seconds
- [X] T003 Implement `src/features/timer/format.ts` with `formatRemaining(ms: number): string` so T002 passes
- [X] T004 [P] Write failing unit tests in `tests/unit/timer/timer-state.test.ts` covering every row of the transition table in `data-model.md`: start from `ready` sets `endAt = now + totalMs`; start from `stopped` resumes with `remainingMs`; stop from `running` stores `remainingMs = endAt - now`; reset from any state returns `ready`; finish from `running` or `stopped` returns `finished`; tick returns `finished` only when `now >= endAt`; an event not allowed from the current status returns the same state object (repeated taps have one effect); `remainingMs` is never negative
- [X] T005 Implement `src/features/timer/timer-state.ts` as a pure reducer with states `ready`, `running`, `stopped`, `finished` and events `start`, `stop`, `reset`, `finish`, `tick`, so T004 passes. Derive remaining milliseconds exactly as `data-model.md` describes

**Checkpoint**: Timer logic is tested and pure. User stories may begin.

---

## Phase 3: User Story 1 - Time a workout and hear when it ends (Priority: P1) 🎯 MVP

**Goal**: Start timer under the session plan, a countdown from the plan's length, one chime at zero, and the timer keeps time when the tab is in the background (spec US1, FR-001 to FR-004, FR-008, FR-011 announcements for start and end).

**Independent Test**: Plan a 10-minute session, tap Start timer, and confirm the countdown runs; with the browser clock moved forward 10 minutes, the chime plays once and "Session complete" is announced.

### Tests for User Story 1 ⚠️

> **NOTE: Write these tests FIRST and confirm they FAIL before implementation**

- [X] T006 [P] [US1] Write failing unit tests in `tests/unit/timer/chime.test.ts` using a fake audio context: the chime creates one context, plays two tones, and does nothing (without throwing) when no audio context exists; a context that cannot resume is treated as unavailable
- [X] T007 [US1] Write failing end-to-end tests in `tests/e2e/workout-timer.spec.ts`: plan a 10-minute session, assert the timer reads `10:00` and shows "Start timer"; tap Start timer and assert the "Timer started" announcement; move the browser clock forward 10 minutes and assert "Session complete" is announced and a chime was requested exactly once; hide the page for longer than the timer, show it again, and assert the finished state appears on return (spec US1 scenario 4)

### Implementation for User Story 1

- [X] T008 [US1] Implement `src/features/timer/chime.ts` so T006 passes: a function `playChime(): boolean` that creates the audio context on the Start tap, plays two short sine tones with a quick decay, and returns false when audio is unavailable. The chime is never called on Finish (contract "Sound")
- [X] T009 [US1] Create `src/components/workout-timer.tsx` as a `"use client"` component taking `totalMinutes`. It holds the reducer state, shows the countdown with tabular digits, shows a Start timer control in `ready` and `stopped`, runs a 250 ms update while `running`, and handles `visibilitychange` by ticking immediately when the page returns (research §3). Labels and the countdown format follow `contracts/timer-ui.md` exactly
- [X] T010 [US1] In the same component, add the polite live region that announces "Timer started" on start and "Session complete" when the clock reaches zero. Call `playChime()` once on the transition into `finished` by the clock only (contract "Sound")
- [X] T011 [US1] Render `<WorkoutTimer totalMinutes={plan.totalMinutes} key={planKey} />` under the total minutes in `src/components/session-plan-list.tsx`, where `planKey` changes whenever a new plan arrives (spec FR-010)
- [ ] T012 [US1] Run `tests/unit/timer/chime.test.ts` and `tests/e2e/workout-timer.spec.ts` (the US1 scenarios) until they pass

**Checkpoint**: User Story 1 is functional. The MVP is a countdown that sounds and announces when it ends.

---

## Phase 4: User Story 2 - Finish early with a celebration (Priority: P2)

**Goal**: A Finish control ends the timer early, and the celebration reads "Well Done, we made it today!!" with a short effect. Reduced motion shows the words still (spec US2, FR-005, FR-006, FR-007).

**Independent Test**: Start a timer, tap Finish after a few seconds, and confirm the celebration shows the exact words, no chime plays, and reduced motion removes the shapes.

### Tests for User Story 2 ⚠️

- [X] T013 [US2] Write failing end-to-end tests in `tests/e2e/workout-timer.spec.ts`: tap Finish while running and assert the celebration text is exactly "Well Done, we made it today!!", the status region holds it, and no chime was requested; repeat with the OS reduced-motion setting on (`page.emulateMedia({ reducedMotion: "reduce" })`) and assert no celebration shape element is visible while the words are
- [X] T014 [US2] Write failing end-to-end tests in the same file: after the celebration appears, tap Start again and assert the timer returns to `ready` at the full length; tapping Finish twice produces one celebration

### Implementation for User Story 2

- [X] T015 [US2] Add the Finish control to the `running` and `stopped` states in `src/components/workout-timer.tsx`, dispatching `finish` to the reducer (contract "Controls")
- [X] T016 [US2] Add the celebration panel to `src/components/workout-timer.tsx`: rendered in `finished`, role `status`, text "Well Done, we made it today!!", a "Start again" control that dispatches `reset`. Show the completion announcement "Session complete" on Finish too (contract "Announcements")
- [X] T017 [P] [US2] Add the celebration styles to `src/app/globals.css` under a timer block: a few accent-coloured shapes that animate with `transform` and `opacity` for about 2.5 seconds, and a `@media (prefers-reduced-motion: reduce)` rule that hides the shapes and stops all animation. Use the app's existing accent token
- [X] T018 [US2] Render the shapes as decorative elements with `aria-hidden` inside the celebration panel in `src/components/workout-timer.tsx`, so the effect adds no words for screen readers
- [ ] T019 [US2] Run the US2 end-to-end tests in `tests/e2e/workout-timer.spec.ts` until they pass

**Checkpoint**: User Stories 1 and 2 work. A user can finish early and see the celebration, and reduced motion is respected.

---

## Phase 5: User Story 3 - Stop or reset the timer (Priority: P3)

**Goal**: A user can pause the countdown and resume it, or return it to the full length (spec US3, FR-009).

**Independent Test**: Start a timer, tap Stop, confirm the countdown holds and "Timer stopped" is announced, then tap Reset and confirm it returns to the full length without starting.

### Tests for User Story 3 ⚠️

- [X] T020 [US3] Write failing end-to-end tests in `tests/e2e/workout-timer.spec.ts`: tap Stop after a few seconds and assert the displayed time holds while the browser clock moves on, and "Timer stopped" is announced; tap Start timer and assert it resumes from the held time, not the full length; tap Reset while stopped and assert it shows the full length in `ready`

### Implementation for User Story 3

- [X] T021 [US3] Add the Stop control to `running` and the Reset control to `stopped` in `src/components/workout-timer.tsx`, dispatching `stop` and `reset` (contract "Controls"). Announce "Timer stopped" on Stop
- [ ] T022 [US3] Run the US3 end-to-end tests in `tests/e2e/workout-timer.spec.ts` until they pass

**Checkpoint**: All three stories work independently and together.

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Quality gates, the phone-width check, copy, and the manual checks in `quickstart.md`

- [X] T023 [P] Run `npx vitest run tests/unit/timer --coverage --coverage.include='src/features/timer/**'` and confirm coverage of `src/features/timer/` is at least 80% (constitution Principle II)
- [X] T024 [P] Run `npm run typecheck`, `npm run lint`, and `npm run build`; all must pass
- [ ] T025 Add a 320px-wide case to `tests/e2e/workout-timer.spec.ts` that asserts every timer control's bounding box stays inside the viewport and is at least 44px tall (contract "Controls")
- [X] T026 Check the copy in `src/components/workout-timer.tsx` against `contracts/timer-ui.md`: the exact celebration text, the exact control labels, and no emoji, decorative symbols, em-dashes, or en-dashes in any visible text
- [ ] T027 Run the manual checklist in `specs/009-workout-timer/quickstart.md` section 3 in a browser and record the result in that file
- [ ] T028 Commit in Conventional Commits form (`feat: add workout timer with finish celebration`), with no co-author trailer. Commit only when the user asks

---

## Dependencies & Execution Order

### Phase dependencies

- **Setup (Phase 1)**: no dependencies
- **Foundational (Phase 2)**: depends on Setup; blocks all stories
- **User Stories (Phases 3 to 5)**: depend on Foundational. They run in order US1, US2, US3, because US2 and US3 extend the component built in US1
- **Polish (Phase N)**: depends on the stories it checks

### Story dependencies

- **US1 (P1)**: needs Foundational. It is the MVP.
- **US2 (P2)**: needs US1's component (T009 to T011)
- **US3 (P3)**: needs US1's component and the reducer's `stop` and `reset` events (T005)

### Within each story

Tests first and failing, then implementation, then the story's test run goes green.

### Parallel opportunities

- Phase 2: T002 and T004 (separate test files)
- US1: T006 (chime test) runs alongside T007 (flow test)
- US2: T017 (styles) runs alongside the component work in T015, T016, T018
- Polish: T023 and T024

---

## Implementation Strategy

### MVP first

Deliver Phase 1, Phase 2, and Phase 3 (US1) first. That gives a countdown that sounds and announces the end, which is the core of the request.

### Incremental delivery

1. US1: countdown, chime, background-safe end
2. US2: Finish and the celebration, with reduced motion
3. US3: Stop and Reset

### Spec gaps (not tasked)

None. Every requirement in `spec.md` maps to at least one task above.
