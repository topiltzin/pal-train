# Implementation Plan: Workout Timer with Finish Celebration

**Branch**: `009-workout-timer` | **Date**: 2026-11-08 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/009-workout-timer/spec.md`

## Summary

Add a Start timer control under the session plan's total minutes. Starting it counts down from the plan's length, plays one synthesised chime at zero, and shows a short celebration that reads "Well Done, we made it today!!". A Finish control ends the countdown early with the same celebration. Stop and Reset give users control. The countdown is driven by the real clock, so it stays correct when the tab is in the background. Nothing is stored or sent. No new dependencies are added.

## Technical Context

**Language/Version**: TypeScript 5, React 19.3, Next.js 16.4.3 App Router (existing).

**Primary Dependencies**: None new. The chime uses the browser's Web Audio API. The celebration uses CSS keyframes. Motion is not needed for this feature.

**Storage**: None. The timer lives in component state and is not saved (spec FR-012).

**Testing**: Vitest for the pure timer logic (`tests/unit/timer/`). Playwright for the flow (`tests/e2e/workout-timer.spec.ts`) using the browser clock. Components are outside the unit coverage scope (see `vitest.config.ts`), so behaviour is covered by the end-to-end test and the pure logic.

**Target Platform**: Mobile and desktop browsers. Phone width 320px is the smallest supported layout.

**Project Type**: Web application (Next.js), one client component added to an existing view.

**Performance Goals**: The display updates once every 250 ms. Animations use only transform and opacity (no layout work). The timer adds no network calls.

**Constraints**: Reduced motion must show the celebration as still text (FR-007). No personal data (FR-012). Sound must start from a user tap, to pass browser autoplay rules. Controls must be at least 44px tall.

**Scale/Scope**: One timer per session plan on screen. One new feature folder, one client component, one CSS animation block, three test files.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle / Gate | Status | How this plan complies |
|------------------|--------|------------------------|
| I. Code quality: names, under 50 lines, early returns, explicit errors | PASS | The reducer and formatters are small named functions. Audio failures are handled explicitly (the celebration still shows). |
| I. No secrets; validate boundaries | PASS | No secrets, no input from outside the app. The total length comes from the already-validated plan. |
| I. No mutation of shared data; no debug output | PASS | The reducer returns new state. No `console` calls. |
| II. Test-first, 80% coverage, AAA, deterministic | PASS | Reducer and formatter unit tests written first. Time is injected, so tests are deterministic. The browser clock controls the end-to-end test. |
| II. Three test levels where applicable | PASS | Unit (timer logic). End-to-end (start, finish, stop, reset, celebration, reduced motion). Integration: none needed, no API or database. |
| III. Feature-organized folders | PASS | Logic in `src/features/timer/`. The client component in `src/components/`. |
| III. No speculative abstraction | PASS | No generic timer library, no audio manager class. One reducer, one chime function. |
| III. New dependency must be justified | PASS | None added. A confetti or audio library was rejected because the effect and the chime are small. |
| Quality gate: security review | NOT REQUIRED | No authentication, no user data, no external calls. |
| Quality gate: accessibility | REQUIRED | Screen reader announcements (FR-011), reduced motion (FR-007), 44px controls, and contrast checked. |

**Result**: No violations. All gates pass.

## Project Structure

### Documentation (this feature)

```text
specs/009-workout-timer/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output: timer states and events
├── quickstart.md        # Phase 1 output: how to run and verify
├── contracts/
│   └── timer-ui.md      # Phase 1 output: controls, states, announcements, copy
├── checklists/
│   └── requirements.md
└── tasks.md             # Created by /speckit-tasks, not by this command
```

### Source Code (repository root)

```text
src/
├── features/timer/
│   ├── timer-state.ts       # Pure reducer: states and transitions (start, stop, resume, reset, finish, tick)
│   ├── format.ts            # Pure: remaining milliseconds to "m:ss"
│   └── chime.ts             # Plays one synthesised chime via Web Audio; no-op when unavailable
├── components/
│   └── workout-timer.tsx    # "use client": the Start/Stop/Reset/Finish controls, the countdown, the celebration
└── components/session-plan-list.tsx   # Renders <WorkoutTimer totalMinutes={plan.totalMinutes} key={planKey} />

tests/
├── unit/timer/
│   ├── timer-state.test.ts
│   └── format.test.ts
└── e2e/
    └── workout-timer.spec.ts
```

The celebration keyframes and the reduced-motion override go in `src/app/globals.css` under a timer-specific block, so they are defined once.

**Structure Decision**: One feature folder for logic, one client component for UI, and one minimal change to the existing plan list. The plan list passes a `key` derived from the plan, so a new plan resets the timer (spec FR-010).

## Complexity Tracking

No constitution violations. Two choices are deliberate: the chime is synthesised rather than shipped as an audio file (no asset to download, no load delay), and the celebration uses CSS rather than a library (smaller and easier to keep reduced-motion correct).
