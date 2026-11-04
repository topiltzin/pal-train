# Implementation Plan: Exercise Demo Shorts

**Branch**: `005-exercise-shorts-videos` (commits go directly to `main`) | **Date**: 2026-11-04 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/005-exercise-shorts-videos/spec.md`

## Summary

Store one reviewed YouTube Short per exercise in a new table in the app's existing Neon database. In the session plan, each exercise that has an active link shows a "Watch demo" control. Tapping it opens an in-page dialog that plays the Short through YouTube's privacy-enhanced player, so the page never navigates away. The plan API returns the active link with each exercise, read in one query for the whole plan. The one-time matching of the channel's Shorts to exercises is a reviewed input file, imported by a script.

## Technical Context

**Language/Version**: TypeScript 5 (strict), React 19, Next.js 16.4 (App Router)

**Primary Dependencies**: Existing only. Drizzle ORM and `@neondatabase/serverless` (already used), Zod (request validation), Motion (already used for dialog motion). The dialog uses the native `<dialog>` element. No new third-party dependency.

**Storage**: Neon Postgres via Drizzle, the same database as `users` and `suggestion_state`. One new table, `exercise_demo_links`. Migration generated with `drizzle-kit`.

**Testing**: Vitest (unit, and integration against the real Neon database as in `tests/integration/`), Playwright (e2e; signed-in flows skip without credentials).

**Target Platform**: Web, phones at 320px and up, desktop. Modern evergreen browsers.

**Project Type**: Web application (Next.js), single project.

**Performance Goals**: The plan request stays within its current response budget. The demo lookup adds one indexed query for at most 10 exercises per plan. The video host is not contacted until the user opens the dialog.

**Constraints**: No navigation to YouTube (spec FR-002). No video host requests before the dialog opens (FR-004). Demo links never change exercise content (FR-012). Only signed-in users (FR-011).

**Scale/Scope**: 130 exercises, at most 10 per plan. Expected launch data: 8 to 10 verified links.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | How this plan complies |
|-----------|--------|------------------------|
| I. Code Quality | PASS | Named constants for the 10-second load timeout and the 11-character video id length. Parsing, lookup, and rendering are separate small functions. A database failure is logged with context and the plan still returns, without links, rather than failing. The exercise list is copied, never changed in place. |
| II. Testing Standards | PASS with plan | The task plan puts tests before implementation for: video id parsing, the one-active-link rule, the repository, the plan response, the dialog, and the e2e flow. Integration tests use the real database, as existing tests do, and remove their own rows. |
| III. Maintainability | PASS | Organised by feature: `src/features/demos/` holds the domain. Business logic depends on a `DemoLinkRepository` interface; the Drizzle implementation is the only database code. No speculative options: one active link per exercise, no admin screen. |
| Quality Gates: security review | REQUIRED | The change touches database queries, a user-facing embed of an external service, and user input at the API boundary. A dedicated security review is required before merge (checklist in quickstart.md). |
| Development Workflow | PASS | Research precedes design (research.md). Commits use Conventional Commits: `feat:` for the feature, `chore:` for the reviewed data import. |

No violations, so Complexity Tracking is not needed.

## Project Structure

### Documentation (this feature)

```text
specs/005-exercise-shorts-videos/
├── spec.md
├── plan.md                        # this file
├── research.md                    # Phase 0
├── data-model.md                  # Phase 1
├── quickstart.md                  # Phase 1 validation guide
├── contracts/
│   ├── session-plan-response.md   # the plan API gains a demo field
│   └── demo-dialog.md             # in-page dialog behaviour
├── demo-links.reviewed.csv        # reviewed exercise-to-Short matches (import input, created in tasks)
└── checklists/requirements.md
```

### Source Code (repository root)

```text
src/
├── features/demos/
│   ├── video-id.ts                       # pure: validates a YouTube video id, builds the embed URL
│   ├── demo-link.ts                      # domain type and the one-active-link rule
│   ├── demo-link-repository.ts           # interface and an in-memory fake for tests
│   └── drizzle-demo-link-repository.ts   # Drizzle implementation (the only database code)
├── features/sessions/
│   ├── handle-session-plan.ts            # attaches demo links to the plan (repository injected)
│   └── session-view.ts                   # ExerciseView gains demo: DemoView | null
├── components/
│   ├── exercise-demo-button.tsx          # "Watch demo" control (client)
│   ├── demo-dialog.tsx                   # in-page dialog with the privacy-enhanced embed (client)
│   └── session-plan-list.tsx             # shows the control on rows that have a demo
├── lib/db/schema.ts                      # + exercise_demo_links table
└── app/api/session-plan/route.ts         # wires the repository into the handler
drizzle/                                  # generated migration for exercise_demo_links
scripts/
└── import-exercise-demos.ts              # one-time import of the reviewed CSV

tests/
├── unit/demos/video-id.test.ts
├── unit/demos/demo-link.test.ts
├── integration/demos/drizzle-demo-link-repository.test.ts
├── integration/api/session-plan.test.ts  # + demo field cases
└── e2e/exercise-demo.spec.ts             # signed-in flow (skipped without credentials)
```

**Structure Decision**: Single Next.js project, organised by feature. `src/features/demos/` is the only place that knows the link rules. The plan handler depends on the repository interface, so unit and handler tests use the in-memory fake, and the Drizzle implementation is tested once against the real database. The reviewed match list is a plain CSV beside the spec, because it is a human review artifact; the database is the runtime source of truth.

## Complexity Tracking

Not applicable. No constitution violations.
