# Implementation Plan: Session Length Range

**Branch**: `003-session-length-range` (not created; this repo commits directly to `main`) | **Date**: 2026-11-03 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/003-session-length-range/spec.md`

## Summary

Add a two-handle session length bar (10 to 90 minutes, 5-minute steps, default 30 to 60) to the home screen. The app builds a session of exercises whose total time falls inside the chosen range. The exercise count scales with the range: at least 3 at 10 minutes and 10 at 90 minutes.

Technical approach: a new exercise dataset under `content/exercises/`, validated with the existing Zod setup. A pure planner in `src/features/sessions/` selects exercises. A new authenticated `POST /api/session-plan` route calls the planner. The UI is a client component built from two native range inputs over one track. No new dependencies and no database changes.

## Technical Context

**Language/Version**: TypeScript 5 on Node.js (Next.js 16.4.3 App Router, React 19.3)

**Primary Dependencies**: Existing only: `zod` 4 (validation), `motion` (reduced-motion-aware transitions), `@phosphor-icons/react` (icons), Auth0 session helpers in `src/features/auth`. No new packages.

**Storage**: Static JSON under `content/exercises/`, bundled like the existing templates (`src/features/library/content-index.ts`). No database writes. Plans are computed per request and not stored.

**Testing**: Vitest 5 for unit and integration tests (`tests/unit`, `tests/integration`), Playwright for e2e (`tests/e2e`), `scripts/validate-content.ts` for content checks, `tsc --noEmit` for types.

**Target Platform**: Web, mobile-first (phone width is the primary layout), desktop supported.

**Project Type**: Web application (Next.js full-stack, single project).

**Performance Goals**: Planning completes in under 20 ms for the full exercise set, measured in unit tests. The bar does not call the API while a handle is being dragged; it replans when the user releases the handle or uses a key.

**Constraints**: Must work with touch, mouse, and keyboard. Each handle needs a screen-reader name and value. Must match the existing light theme and the home screen tokens. Session total must never exceed the maximum. No secrets in source.

**Scale/Scope**: About 10 focus areas, roughly 60 to 100 exercises at launch, one range control, one endpoint.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle / gate | Status | How this plan meets it |
|---|---|---|
| I. Code quality: functions under 50 lines, nesting at most 4, named constants | PASS (planned) | Planner split into small helpers (count target, candidate filter, greedy fill, minimum top-up). Range limits and count constants live in one module, `src/features/sessions/session-length.ts`. The existing `MIN_MINUTES` and `MAX_MINUTES` in `handle-templates.ts` will import that module instead of repeating the numbers. |
| I. Errors handled explicitly; input validated at the boundary | PASS (planned) | Request body validated with Zod at the route, returning `INVALID_INPUT` with a clear message. Content validated at load time, the same as templates. |
| II. Test-first (RED, GREEN, IMPROVE) | PASS (planned) | Each module gets its tests written before it. Order is in quickstart.md. |
| II. Coverage at least 80%; unit, integration, and e2e levels | PASS (planned) | Unit: planner, range clamping, schema, content. Integration: `POST /api/session-plan`. E2E: range bar to plan total. |
| III. Files 200 to 400 lines, organized by feature | PASS (planned) | New code lives under `features/sessions/`, `components/session-*`, and `api/session-plan/`. No file expected above 200 lines. `home-experience.tsx` gains one import and one section. |
| III. No speculative abstraction; no new dependency without justification | PASS | No generic recommender or plugin system. Native inputs instead of a slider library. |
| Quality gate: security review for user input handling and auth-adjacent routes | ACTION | The route accepts user input and sits behind `requireUser`. The spec's gate list does not name input handling, but this route follows the suggestions route, so a security-reviewer pass is recommended before merge. |
| Quality gate: all checks pass (tests, lint, types, build) | PASS (planned) | Run `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:e2e`. |

**Result**: No unjustified violations. One recommended action (security review).

## Project Structure

### Documentation (this feature)

```text
specs/003-session-length-range/
├── spec.md
├── plan.md              # this file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── session-plan-api.md
├── checklists/
│   └── requirements.md
└── tasks.md             # created by /speckit-tasks, not by this command
```

### Source Code (repository root)

```text
content/
└── exercises/
    ├── chest.json          # one file per focus area, same split as content/templates
    ├── ...                 # (remaining focus areas)
    └── stretching.json

src/
├── features/
│   └── sessions/
│       ├── session-length.ts       # range limits, step, exercise-count rule (named constants)
│       ├── exercise.schema.ts      # Zod schema for one exercise
│       ├── exercise-library.ts     # loads and parses exercises once, like library-repository.ts
│       ├── range.ts                # clampRange(handle, value, current): pure
│       ├── plan-session.ts         # planSession(): pure selection, deterministic with injected random
│       ├── handle-session-plan.ts  # request parsing, auth, response envelope
│       └── session-view.ts         # maps an exercise to the API view (no internal fields)
├── app/
│   └── api/
│       └── session-plan/
│           └── route.ts            # thin POST wrapper, same shape as api/suggestions/route.ts
└── components/
    ├── session-length-range.tsx    # client component: two range inputs, labels, live text
    └── session-plan-list.tsx       # client component: exercises, minutes, equipment, total

tests/
├── unit/
│   └── sessions/
│       ├── session-length.test.ts
│       ├── exercise-schema.test.ts
│       ├── range.test.ts
│       └── plan-session.test.ts
├── integration/
│   └── api/
│       └── session-plan.test.ts
└── e2e/
    └── session-length.spec.ts
```

**Structure Decision**: Single Next.js project, feature-first. The planner and range logic sit under `src/features/sessions/` with no React imports, so they run in unit tests without a DOM. The route and UI sit on top. Session planning does not reuse `features/suggestions/`, because that module returns routine templates, not exercises.

## Design Notes

### Exercise count rule

With `MIN_EXERCISES = 3`, `MAX_EXERCISES = 10`, `MIN_MINUTES = 10`, and `MAX_MINUTES = 90`:

`targetCount(maxMinutes) = MIN_EXERCISES + round((maxMinutes - MIN_MINUTES) / (MAX_MINUTES - MIN_MINUTES) * (MAX_EXERCISES - MIN_EXERCISES))`

Results: 10 minutes gives 3, 30 gives 5, 60 gives 7, 90 gives 10. The count depends on the maximum only, so it never decreases as the range grows.

### Selection

1. Filter exercises to those matching both mood and focus. If none match, fall back to either, and mark the plan `partial`. This mirrors `select-suggestions.ts`.
2. Shuffle candidates with the injected random source.
3. Greedy fill: take candidates in order while the count is below `targetCount` and the total stays at or below the maximum.
4. Minimum top-up: if the total is below the minimum, keep adding candidates that still fit under the maximum, ignoring the count target.
5. If the count is below 3, return what fits and set `partial` with a shortfall message. A total below the minimum minutes is not partial.

No exercise repeats within a plan, since candidates are unique by id.

### Range control

- Two `<input type="range">` elements overlaid on one track. Only the thumbs take pointer events.
- The minimum handle cannot pass the maximum, and the reverse. `clampRange` enforces this.
- Dragging updates the visible text (for example "30 to 45 minutes") at once. The request runs on release, key up, or blur, not on every move.
- Labels: "Shortest session" and "Longest session". The text sits in an `aria-live="polite"` region.

### API

`POST /api/session-plan`, JSON body with `minMinutes`, `maxMinutes`, and optional `mood` and `focus`. Full contract in [contracts/session-plan-api.md](./contracts/session-plan-api.md).

### Dependency on content

The current library holds routines with one duration each, so the planner cannot use it. The plan adds `content/exercises/`. Launch content needs enough exercises per focus area to reach the target count at 90 minutes. Authoring this data is a content task, tracked in tasks.md.

### Design direction

The bar follows the home screen's visual language: pill-shaped controls, dark ink for the active track, muted accent for the selected span, the existing 44px minimum touch target, and the existing focus outline. Motion is limited to a short transition on the highlighted span, disabled under reduced motion.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| None | | |

Content volume (exercise data) is larger than the code. This is data work, not added structure.
