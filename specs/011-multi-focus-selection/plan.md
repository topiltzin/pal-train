# Implementation Plan: Plan a Workout for More Than One Muscle Group

**Branch**: `011-multi-focus-selection` (not created; this repo commits directly to `main`) | **Date**: 2026-11-10 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/011-multi-focus-selection/spec.md`

## Summary

Let a user choose one to three muscle groups (for example biceps and triceps) for one workout, in the app and through the ChatGPT connector. The planner already builds sessions by exercise count; with several groups, each group gets an even share of that count, within the same minutes cap. A single group keeps today's path exactly. Groups that cannot be fully covered are named in a notice. Nothing is stored. Details are in [research.md](research.md), [data-model.md](data-model.md), [contracts/plan-interfaces.md](contracts/plan-interfaces.md), and [quickstart.md](quickstart.md).

## Technical Context

**Language/Version**: TypeScript on Node.js (Vercel default), Next.js 16.4.3 App Router

**Primary Dependencies**: `zod` (request validation, existing), `@modelcontextprotocol/server` (connector, existing), React (picker, existing). No new dependencies.

**Storage**: None added. Existing tables are unchanged.

**Testing**: Vitest (`npm test`) for unit and integration; Playwright for end-to-end (existing focus specs in `tests/e2e/`).

**Target Platform**: Vercel (Fluid Compute) for the app and connector.

**Project Type**: Web application with a planning API, a connector, and a client picker.

**Performance Goals**: Planning stays in memory on the library already loaded per instance; no extra database round trips.

**Constraints**: Single-group plans must match today's plans (FR-007, SC-004). The picker, API, and connector must agree (FR-010, SC-005). Maximum three groups (spec Assumptions).

**Scale/Scope**: The exercise library is small (tens of exercises per group); no scaling concern.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Checked against `.specify/memory/constitution.md` (version 1.0.0):

| Principle | Check | Result |
|-----------|-------|--------|
| I. Code Quality | New functions stay under 50 lines and nesting under 4. Named constants for the limit of three and the notice reasons. | Pass (enforced in tasks) |
| II. Testing Standards | Test-first. The single-group identity test is written before any change. Coverage stays at or above 80% for changed code. | Pass (enforced in tasks) |
| III. Maintainability | No new abstraction beyond the group share rule. Single-group path kept as it is (research Decision 2), so no speculative generalization. | Pass |
| Quality gates | Lint, types, build, and tests before merge. This change does not touch authentication, so no security review is required by the constitution for it. | Pass |

**Post-design re-check**: No violations after Phase 1. The design adds no new dependency, storage, or external call.

## Project Structure

### Documentation (this feature)

```text
specs/011-multi-focus-selection/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── plan-interfaces.md
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
│   │   ├── plan-session.ts            # CHANGED: multi-group share, groupNotices; single-group path unchanged
│   │   ├── plan-notices.ts            # NEW: builds groupNotices from per-group results
│   │   ├── handle-session-plan.ts     # CHANGED: focus accepts one or a list (1 to 3), dedupes, refuses a fourth
│   │   ├── session-view.ts            # CHANGED: adds groupNotices to the response view
│   │   └── focus-selection.ts         # NEW: parses and validates the focus list (shared by API and connector)
│   └── mcp/
│       └── tools.ts                   # CHANGED: plan_session accepts a focus list, uses focus-selection.ts
├── components/
│   ├── focus-picker.tsx               # CHANGED: multi-select, limit of three
│   └── session-planner.tsx            # CHANGED: sends the list; shows groupNotices
└── app/
    ├── (app)/page.tsx                 # CHANGED: reads a comma-separated focus parameter
    └── mcp/route.ts                   # UNCHANGED (its schema comes from server.ts)

tests/
├── unit/sessions/
│   ├── plan-session.test.ts           # CHANGED: single-group identity; count split; coverage
│   ├── plan-notices.test.ts           # NEW: notice reasons
│   └── focus-selection.test.ts        # NEW: limit, duplicates, unknown ids
├── integration/api/session-plan.test.ts  # CHANGED: list input, groupNotices
└── e2e/focus-menu.spec.ts             # CHANGED: multi-select in the picker
```

**Structure Decision**: Feature folders under `src/features/sessions/` and `src/features/mcp/`, as the constitution requires. The shared parser `focus-selection.ts` avoids duplicating the limit and duplicate rules in the API and the connector (Principle III). The rest stays in the files that already own each concern.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations. The single-group path is deliberately left intact instead of generalized, which keeps the identity requirement simple to prove.
