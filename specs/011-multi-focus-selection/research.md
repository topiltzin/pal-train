# Research: Plan a Workout for More Than One Muscle Group

**Feature**: 011-multi-focus-selection | **Spec**: [spec.md](spec.md)

## Current state

- **Planner** (`src/features/sessions/plan-session.ts`): takes one `focus?: FocusId`. Exercises match when `exercise.focus === focus`. The count of exercises comes from `targetExerciseCount(maxMinutes)` (3 to 15, rising with the length); the minutes must stay under `maxMinutes` and reach `minMinutes` when possible.
- **API** (`src/features/sessions/handle-session-plan.ts`): request schema `focus: z.enum(focusIds).optional()`. Requires at least one of `mood` or `focus`.
- **MCP tool** (`src/features/mcp/tools.ts`): `plan_session` takes `focus?: string`, checked by `requireFocus`, which refuses unknown ids and lists the valid ones.
- **App UI**: `src/components/focus-picker.tsx` is single-select (`onSelect(focus | null)`). `src/components/session-planner.tsx` sends one `focus` to the API.
- **Library**: the focus areas include `biceps` and `triceps`, so no content changes are needed.

## Decision 1: Shared time is shared exercise count, within the same minutes cap

- **Decision**: For a plan with N selected groups, the target exercise count is still `targetExerciseCount(maxMinutes)`. Each group gets an even share of that count, rounding up so no group gets less than one exercise when the count allows. The minutes cap and the minimum rules stay as they are for the whole plan.
- **Rationale**: The planner decides by count, not by minutes, so sharing count keeps the same pacing rules. The spec's "5-minute steps" open item is resolved this way: the minutes cap is still in 5-minute steps, and no new rounding rule is needed.
- **Alternatives considered**: dividing the minutes budget per group (rejected: it would need a separate minutes planner and a second source of truth); giving each group the full count (rejected: plans would be N times longer than requested).

## Decision 2: Keep single-group behavior identical

- **Decision**: With one group, the code path is the same as today: the same filter, the same count, the same shuffle order for the same random seed. The multi-group path is only used when two or more groups are given.
- **Rationale**: Spec FR-007 and SC-004 require the single-group plan to match today's plan. Keeping the old path untouched is the simplest way to guarantee that.
- **Alternatives considered**: a single generalized path that treats one group as a list of one (rejected unless the tests prove identical output for every input; it is a refactor risk without a benefit for this feature).

## Decision 3: Groups are a list everywhere, with a cap of three

- **Decision**: The API field `focus` accepts either one id or an array of one to three ids. The MCP tool `plan_session` accepts the same. Duplicates are removed before counting. A fourth id is refused with a message that the limit is three.
- **Rationale**: Accepting the old single value keeps existing connector prompts and bookmarked app URLs working (spec Assumptions). The cap of three keeps the session short enough to finish in the requested time (spec Assumptions).
- **Alternatives considered**: a separate `focuses` field (rejected: two fields for one concept); no cap (rejected: the even split becomes meaningless with many groups).

## Decision 4: Notices for groups that cannot be covered

- **Decision**: After planning, each selected group is checked. A group with no exercises is listed as having none. A group that gets fewer exercises than its share is listed as shortened, with the reason "not enough time" or "not enough exercises". The notice reuses the existing plan-notice channel.
- **Rationale**: Spec FR-008 and User Story 3 require naming the group and the reason. The existing notice channel already shows the partial-plan message, so no new UI channel is needed.

## Decision 5: The picker allows up to three selections

- **Decision**: The picker becomes multi-select with a limit of three. Selecting a fourth shows the limit message. Tapping a selected group deselects it. The "any" state (no focus) stays available. The URL and API carry the selection as a comma list (for example `focus=biceps,triceps`).
- **Rationale**: Keeps the app and the connector in step (spec FR-010) and keeps links shareable.
- **Alternatives considered**: a separate page for multi-select (rejected: more navigation for one control).

## Open items carried into implementation

1. Confirm the picker's visual treatment of a selected state on small screens, during the UI task.
2. Confirm the notice wording with the existing copy style, during the notice task.

## Baseline (T002, before any change)

 Test Files  1 failed | 69 passed (70)
      Tests  2 failed | 364 passed (366)
Pre-existing: one test fails before any change, tests/integration/api/suggestions-next.test.ts ("never returns the last shown template first"). It times out at 5 seconds under load and is unrelated to this feature.
