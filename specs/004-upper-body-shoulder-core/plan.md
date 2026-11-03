# Implementation Plan: Upper Body, Shoulder, and Core Options

**Branch**: `004-upper-body-shoulder-core` (not created; this repo commits directly to `main`) | **Date**: 2026-11-03 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/004-upper-body-shoulder-core/spec.md`

## Summary

Add three muscle group options, "Upper body", "Shoulders", and "Core", to the home screen menu and the library. Add routines for each area and exercises for session planning. Check every existing routine's intensity level against a written rubric, correct mismatches, and record each change for review.

Technical approach: the focus list is a single source (`focusIds` and `focusAreas`), so adding the three ids flows through the picker, the library routes, the template and exercise schemas, and the content checks. New content goes in JSON files that the existing content indexes load. The level check is a documented review with a record file, backed by the existing schema rules. No new dependencies, no database changes, and no new endpoints.

## Technical Context

**Language/Version**: TypeScript 5 on Node.js (Next.js 16.4.3 App Router, React 19.3)

**Primary Dependencies**: Existing only: `zod` 4, `@phosphor-icons/react`, `motion`. No new packages.

**Storage**: Static JSON under `content/templates/` (routines) and `content/exercises/` (exercises), bundled through the existing content index files. No database writes.

**Testing**: Vitest 5 (`tests/unit`, `tests/integration`), Playwright (`tests/e2e`), `scripts/validate-content.ts` for content minimums, `tsc --noEmit`, ESLint.

**Target Platform**: Web, mobile-first, desktop supported.

**Project Type**: Web application (Next.js full-stack, single project).

**Performance Goals**: No change. Library pages are static per focus area; the picker renders 13 options.

**Constraints**: The picker must still fit a 320 px phone without horizontal scrolling. Every routine and exercise has exactly one intensity level. High-intensity items keep a caution. No secrets in source.

**Scale/Scope**: 3 new focus areas, about 8 to 12 routines each (at least 8, at least 2 per level), and 10 exercises each. Level check covers the existing routines (currently 127) and existing exercises (currently 100).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle / gate | Status | How this plan meets it |
|---|---|---|
| I. Code quality: small functions, named constants, explicit errors | PASS (planned) | Code changes are a list entry and two id arrays. Routines and exercises are validated at load time by existing schemas. |
| I. No speculative abstraction | PASS | No new level system. The existing low, moderate, high labels are used (spec Assumptions). |
| II. Test-first | PASS (planned) | Tests for the new focus ids and content minimums are written before the content files (see quickstart). |
| II. Coverage at least 80% on new code | PASS (planned) | New code is the focus list entries and the level-check script if one is added. Content is validated by the content check, which runs in CI. |
| III. Files 200 to 400 lines, organized by feature | PASS (planned) | Content split one file per focus area, as for existing areas. |
| III. No new dependency without justification | PASS | None added. |
| Quality gate: security review for user input handling | PASS (not applicable) | No new input path. Focus ids are already validated against `focusIds`, a closed enum. |
| Quality gate: all checks pass | PASS (planned) | Typecheck, lint, tests, content check, build, e2e. |

**Result**: No violations. Two risks are recorded: the level check touches existing content (corrections need review), and the 13-option picker needs a phone-width check.

## Project Structure

### Documentation (this feature)

```text
specs/004-upper-body-shoulder-core/
├── spec.md
├── plan.md                  # this file
├── research.md              # Phase 0: rubric, area boundaries, content plan
├── data-model.md            # Phase 1: focus area, routine, exercise, level check record
├── quickstart.md            # Phase 1: validation steps
├── level-check.md           # produced by the level check task (one row per existing routine)
├── contracts/
│   ├── focus-areas-api.md   # GET /api/focus-areas response with the new options
│   └── content-files.md     # JSON shape for routine and exercise files
├── checklists/
│   └── requirements.md
└── tasks.md                 # created by /speckit-tasks, not by this command
```

### Source Code (repository root)

```text
src/features/library/
├── focus-areas.ts            # add 3 ids to focusIds and 3 entries to focusAreas
└── content-index.ts          # import content/templates/{upper-body,shoulders,core}.json

src/features/sessions/
└── exercise-content-index.ts # import content/exercises/{upper-body,shoulders,core}.json

content/templates/
├── upper-body.json           # new, 8 to 12 routines
├── shoulders.json            # new
└── core.json                 # new

content/exercises/
├── upper-body.json           # new, at least 10 exercises
├── shoulders.json            # new
└── core.json                 # new

content/templates/*.json      # existing files: level corrections only (FR-007)
content/exercises/*.json      # existing files: level corrections only (FR-007)

tests/unit/library/
└── focus-areas.test.ts       # new: ids and labels for the three areas
tests/integration/api/
└── focus-areas.test.ts       # update: expect 13 focus areas, not 10
tests/e2e/
└── phone-layout.spec.ts      # extend: picker fits 320 px with 13 options
scripts/
└── validate-content.ts       # existing: already checks every focus id; add level-coverage checks
```

**Structure Decision**: Single Next.js project, feature-first. The three areas join the existing content and library structure. Nothing new is created in `src/`, except tests.

## Design Notes

### Focus area additions

Add to `focusIds` in this order: `upper-body`, `shoulders`, `core`. Add matching entries to `focusAreas`:

- Upper body: "Pressing and pulling work for the arms and torso that is not specific to chest or back."
- Shoulders: "Deltoid and rotator-cuff work."
- Core: "Trunk stability, bracing, and rotation."

Because the content index, schema, library routes, and picker all read `focusIds` or `focusAreas`, no route or component changes are needed for the new ids. The integration test that counts focus areas moves from 10 to 13.

### Content minimums

The existing `scripts/validate-content.ts` already enforces a minimum number of routines and exercises per focus area, and checks mood coverage. Raise the per-focus routine minimum to 8 for the new areas (already 8) and add two checks: at least 2 routines at each intensity level per focus area, and at least 10 exercises per focus area. Those checks apply to all focus areas, so the existing ones must already meet them. The level check (below) confirms that before the rule is enabled.

### Level check

Rubric (recorded in research.md):
- **low**: mobility, recovery, or controlled work the user can do with no load above light; no fast or explosive movement.
- **moderate**: loaded sets or sustained bodyweight work at a pace the user can hold; no maximal effort.
- **high**: heavy loads, maximal effort, explosive or plyometric movement, or a skill with a real injury risk. Requires a caution.

Process: each existing routine and exercise is read against the rubric. Each one gets a row in `level-check.md` with its id, current level, assigned level, and reason. A change is made only when the level does not match the rubric. Changed rows are marked for review. The content check then runs over all files.

### Mood and matching

No change. New routines and exercises use the existing mood ids, and the planner's exact-then-closest matching applies unchanged.

### Phone layout

The picker grows from 10 to 13 options. The phone-width e2e check (320 px) must still show no horizontal scroll. If it fails, the picker wraps rather than scrolling.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| None | | |

Content volume (about 30 routines and 30 exercises, plus corrections to existing files) is the largest piece of work. It is data, not added structure.
