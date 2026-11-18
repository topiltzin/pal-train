# Data Model: Swap an Exercise for Another of the Same Type

Nothing is stored. Every structure below is either an existing library record or in-memory state for one page visit.

## Exercise (existing, server library)

Defined in `src/features/sessions/exercise.schema.ts`. Not changed.

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | Pattern `<group>-NNN`, for example `biceps-004`. Unique. |
| `name` | string | 3 to 60 characters. |
| `description` | string, optional | Up to 200 characters. |
| `focus` | muscle group id | The "type" that swaps stay within (FR-003). |
| `moods` | mood ids | Not used by swaps. |
| `minutes` | integer | 1 to 30. Used for the length check (FR-007). |
| `intensity` | low / moderate / high | Shown on options (FR-006). |
| `equipment` | string[] | Shown on options. Not used to filter. |
| `caution` | string, optional | Required when intensity is high. |

## ExerciseView (existing API view, extended by nothing)

Defined in `src/features/sessions/session-view.ts`. Used for both plan cards and option cards. `demo` is filled by the shared demo lookup (FR-010, FR-011).

## SwapOption (new API view)

| Field | Type | Notes |
|-------|------|-------|
| `exercise` | ExerciseView | Same shape as a plan card. |
| `available` | boolean | `false` when the swap would break the length range. |
| `unavailableReason` | `"over_length"` or `null` | `null` when `available` is true. |

Rules:
- Options are never the card's own exercise and never an exercise already in the plan (FR-004).
- Options are in library order. Only exercises with the same `focus` are returned (FR-003).
- A swap is available only when the new total minutes stay within the requested minimum and maximum (FR-007).

## SwapAlternatives (new API view)

| Field | Type | Notes |
|-------|------|-------|
| `exerciseId` | string | The card being swapped. |
| `focus` | muscle group id | Taken from the library record, not the request. |
| `options` | SwapOption[] | May be empty. Empty means no alternatives exist (FR-008). |

## Plan state (client, in memory)

Held by `SessionPlanner` (existing). Changes made by this feature:

| Field | Change |
|-------|--------|
| `plan.exercises` | One entry replaced by a swap. Order is kept (FR-002). |
| `plan.totalMinutes` | Recomputed as the sum of minutes after each swap (FR-007). |
| `plan.shortfallMessage`, `plan.groupNotices` | Unchanged by swaps. They describe how the plan was first generated. |
| `timerRunning` | New. Set by the timer's `onRunningChange`. Disables swap controls while true (FR-009). |

## Swap cursor (client, in memory)

A per-card index into that card's options list. It advances on each quick swap and wraps around (FR-005). It resets when the plan is regenerated.

## Validation rules (server, request body)

`POST /api/exercise-alternatives`:

| Field | Rule |
|-------|------|
| `exerciseId` | Must match an id in the library. Otherwise INVALID_INPUT. |
| `currentExerciseIds` | 1 to `MAX_EXERCISES` ids, each in the library, must include `exerciseId`. |
| `minMinutes`, `maxMinutes` | Same rules as `/api/session-plan`: each an integer from `SLIDER_MIN_MINUTES` (0) to `MAX_MINUTES` (90), in `STEP_MINUTES` (5) steps, min not above max. |

Duplicates in `currentExerciseIds` are removed before the length check, as the planner already does for picks.
