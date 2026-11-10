# Contract: Planning interfaces with more than one group

**Feature**: 011-multi-focus-selection | **Data model**: [data-model.md](../data-model.md)

Two interfaces change: the app's planning API and the connector's `plan_session` tool. Both accept the same selection and return the same plan for the same inputs (spec FR-010, SC-005).

## 1. App planning API

`POST /api/session-plan` (existing route, `src/app/api/session-plan/route.ts`)

Request body:

```json
{
  "minMinutes": 0,
  "maxMinutes": 30,
  "mood": "tired",
  "focus": ["biceps", "triceps"]
}
```

- `focus` may be a single id string (unchanged behavior) or an array of one to three ids.
- A fourth id returns `400` with a message that the limit is three.
- An unknown id returns `400` with the valid ids (existing `invalid_focus` behavior).
- `mood` and `focus` are still both optional, but at least one must be present.

Response `200` (additions only; existing fields unchanged):

```json
{
  "exercises": [ ... ],
  "totalMinutes": 28,
  "targetCount": 6,
  "partial": false,
  "fallback": false,
  "groupNotices": [
    { "group": "triceps", "reason": "not_enough_exercises" }
  ]
}
```

- `groupNotices` is always present. It is an empty array for a single group, and for a plan that covers every group.
- Single-group requests return the same exercises as before, with `groupNotices: []` (spec FR-007).

## 2. Connector tool `plan_session`

Input (`src/features/mcp/server.ts`, `src/features/mcp/tools.ts`):

| Field | Type | Rules |
|-------|------|-------|
| mood | string, optional | Unchanged. |
| focus | string or array of strings, optional | A single id as today, or one to three ids. |
| minutes | number | Unchanged. |

Output (text result, JSON inside the text, as today): the same fields as the API response above, including `groupNotices`.

Errors (unchanged shape): `invalid_focus` lists the valid ids; a list longer than three returns `invalid_focus` with the limit message.

## 3. Compatibility

- Existing connector prompts that name one group keep working unchanged.
- Existing app links with `focus=<one id>` keep working unchanged.
- The `groupNotices` field is additive. Clients that ignore unknown fields are unaffected.
