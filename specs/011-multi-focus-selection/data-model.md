# Data Model: Plan a Workout for More Than One Muscle Group

**Feature**: 011-multi-focus-selection | **Research**: [research.md](research.md)

No new tables. A selection and a plan exist only for the request that makes them (spec FR-012). The library, the exercises, and the existing `mcp_*` and `users` tables are unchanged.

## MuscleGroupSelection (request-time value)

| Field | Type | Rules |
|-------|------|-------|
| groups | ordered list of focus ids | 0 to 3 entries after cleanup; each entry must be a known focus id; duplicates removed, first occurrence kept |

Validation:
- More than three ids (before duplicates are removed) is refused with the limit message; the first three are not kept silently (spec FR-002 says the first three are kept in the app; the API refuses instead, and the app trims before sending).
- An unknown id is refused with the list of valid ids (spec FR-009).
- An empty list is the same as "no focus" (any group).

## PlanRequest (extends the existing request)

| Field | Type | Rules |
|-------|------|-------|
| minMinutes, maxMinutes | integers | Unchanged. 0 to 90 in steps of 5 (existing rules). |
| mood | mood id, optional | Unchanged. Applies to every group. |
| focus | one focus id, or a list of one to three | New: a list. A single id stays valid (backward compatible). |

At least one of `mood` or `focus` must be present (existing rule).

## SessionPlan (extends the existing result)

| Field | Type | Notes |
|-------|------|-------|
| exercises | list | Unchanged shape. Includes exercises from every covered group. |
| totalMinutes | integer | Unchanged. |
| targetCount | integer | Unchanged. |
| partial | boolean | Unchanged. |
| fallback | boolean | Unchanged. |
| groupNotices | list of { group, reason } | New. Empty for a single group and for any plan that covers every group. `reason` is `no_exercises`, `not_enough_time`, or `not_enough_exercises`. |

## State transitions

None. A plan is produced once per request and is not stored.

## Count rule for a selection

- `target` = `targetExerciseCount(maxMinutes)` (unchanged).
- `share` for each group = `ceil(target / N)`, where N is the number of groups, capped so the total never exceeds the target.
- A group with fewer exercises than its share gets a `groupNotices` entry (`not_enough_exercises`). A group with none gets `no_exercises`. A group given fewer exercises because the minutes cap ran out gets `not_enough_time`.
