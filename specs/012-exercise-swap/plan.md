# Implementation Plan: Swap an Exercise for Another of the Same Type

**Branch**: `012-exercise-swap` (not created; this repo commits directly to `main`) | **Date**: 2026-11-18 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/012-exercise-swap/spec.md`

## Summary

Each card in a generated workout gets a swap control. A swap replaces that exercise with another exercise of the same muscle group that is not already in the plan, keeps the plan's order, and keeps the total within the chosen length range. Repeated swaps cycle through the options. A list shows the options with their details. A new stateless endpoint supplies the options, because the exercise library lives on the server. Swaps are disabled while the workout timer runs. Nothing is stored. Details are in [research.md](research.md), [data-model.md](data-model.md), [contracts/exercise-alternatives-api.md](contracts/exercise-alternatives-api.md), and [quickstart.md](quickstart.md).

## Technical Context

**Language/Version**: TypeScript on Node.js (Vercel default), Next.js 16.4.3 App Router, React 19.3.0

**Primary Dependencies**: `zod` (request validation, existing), `motion` (card change, existing), `@phosphor-icons/react` (swap icon, existing). No new dependencies.

**Storage**: None added.

**Testing**: Vitest (`npm test`) for unit and integration; Playwright for end-to-end (`tests/e2e/`).

**Target Platform**: Vercel (Fluid Compute) for the app; browsers on phone and desktop widths.

**Project Type**: Web application: one new API endpoint plus client card changes.

**Performance Goals**: The options call adds one request per open list, with no database work except the existing demo lookup. Swap cycling makes no request.

**Constraints**: Swaps must keep the total within the range (FR-007). The plan endpoint's output must not change (its tests must still pass). The card keeps the existing visual style (FR-013). Reduced motion removes the fade (FR-014).

**Scale/Scope**: About 13 muscle groups with 10 to 14 exercises each. Options per request are at most the group size minus one.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Checked against `.specify/memory/constitution.md` (version 1.0.0):

| Principle | Check | Result |
|-----------|-------|--------|
| I. Code Quality | Input validated at the endpoint boundary with zod. Errors handled explicitly with user messages and server logs. Length limit and cycle rules as named constants. Immutable updates when replacing a plan entry. Functions under 50 lines and nesting under 4 (to be checked in review). | Pass (enforced in tasks) |
| II. Testing Standards | Test-first for the pure rules (options, length check, cycling, replacement) and the endpoint. Card and options behavior is covered end to end, because Vitest's unit config excludes `src/components/**`. Coverage at or above 80% for changed `src/**/*.ts` code. E2E test for the signed-in flow. | Pass (enforced in tasks) |
| III. Maintainability | New code is organized by feature (`features/sessions`, `components`). Demo lookup is extracted rather than copied (DRY). No store is added for one consumer (YAGNI). Source files stay under 200 to 400 lines by splitting the card out of the list. | Pass |
| Quality gates | Lint, types, build, and tests before merge. Authentication is reused, not changed, so no dedicated security review is triggered by a change to auth code. The endpoint takes user input and calls the existing demo lookup, so it gets a normal review with input validation checked. | Pass |
| Development workflow | Research done first (the planner, demo lookup, and card code were reused where they fit). Tests before implementation. | Pass |

**Post-design re-check**: No violations after Phase 1. The design adds one endpoint, one pure module, two components, and one extracted helper. It adds no dependency, no storage, and no store.

## Project Structure

### Documentation (this feature)

```text
specs/012-exercise-swap/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── exercise-alternatives-api.md
├── checklists/
│   └── requirements.md
└── tasks.md   # Phase 2 output (/speckit-tasks; NOT created by /speckit-plan)
```

### Source Code (repository root)

Only the paths this feature touches are listed.

```text
src/
├── features/
│   ├── sessions/
│   │   ├── swap-alternatives.ts          # NEW: pure rules: same type, not in plan, length check, library order
│   │   ├── swap-cursor.ts                # NEW: next available option after the last one, wrapping (client-safe)
│   │   ├── replace-plan-exercise.ts      # NEW: immutable replacement of one plan entry; recomputes total minutes
│   │   ├── handle-exercise-alternatives.ts # NEW: POST handler (auth, zod, library lookup, demo attach)
│   │   ├── handle-session-plan.ts        # CHANGED: uses the extracted demo helper (no behavior change)
│   │   └── session-view.ts               # CHANGED: SwapOption and SwapAlternatives view types
│   ├── demos/
│   │   └── attach-active-demos.ts        # NEW: extracted from handle-session-plan.ts; shared by both endpoints
│   └── analytics/
│       └── event-catalog.ts              # CHANGED: adds "exercise swapped" with exercise id and focus only
├── app/
│   └── api/
│       └── exercise-alternatives/
│           └── route.ts                  # NEW: thin POST route delegating to the handler
├── components/
│   ├── session-plan-list.tsx             # CHANGED: renders ExerciseCard per plan entry; passes swap handlers and timerRunning
│   ├── exercise-card.tsx                 # NEW: one plan card (existing style) with swap control and options disclosure
│   ├── exercise-swap-options.tsx         # NEW: option cards (name, minutes, equipment, intensity); unavailable options with reason
│   ├── session-planner.tsx               # CHANGED: holds plan state; swap fetch; timerRunning; replacement
│   └── workout-timer.tsx                 # CHANGED: optional onRunningChange callback
tests/
├── unit/
│   └── sessions/
│       ├── swap-alternatives.test.ts     # NEW
│       ├── swap-cursor.test.ts           # NEW
│       └── replace-plan-exercise.test.ts # NEW
├── integration/
│   └── api/exercise-alternatives.test.ts     # NEW: endpoint contract, auth refusal, validation, demo fallback
└── e2e/
    └── exercise-swap.spec.ts             # NEW: signed-in swap flow (skips without test credentials)
```

**Structure Decision**: Feature code lives under `src/features/sessions/` next to the planner it extends, following the pattern of spec 011. The shared demo lookup moves to `src/features/demos/` because it already belongs to that module. UI goes in `src/components/`, one component per file. The endpoint is a thin route over a handler, as `/api/session-plan` is.

## Design Notes

- **Endpoint shape** (see contract): the card sends its exercise id, the plan's ids, and the range. The server computes the options and the length check. Unknown ids are refused.
- **Cycling** (FR-005): `swap-cursor.ts` takes the options list and the last index and returns the next available option, wrapping around. It is a pure function, so it is tested without the DOM.
- **Replacement** (FR-002, FR-007): `replace-plan-exercise.ts` returns a new plan with one entry changed and total minutes recomputed. It does not change the plan's notices.
- **Shortfall notices**: swaps stay inside the range, so the existing shortfall message is left as it was. Documented here so it can be revisited if a swap ever makes it misleading.
- **Timer lock** (FR-009): `WorkoutTimer` reports its running state through `onRunningChange`. The planner passes the flag to the list, which disables swap controls while it is true.

## Complexity Tracking

No constitution violations to justify.
