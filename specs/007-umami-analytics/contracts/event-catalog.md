# Contract: Analytics Event Catalog

**Feature**: 007-umami-analytics | **Owner module**: `src/features/analytics/event-catalog.ts`

This is the contract between the app and the analytics data. Every event the app sends is one of the entries below. Adding, renaming, or changing the fields of an entry is a change to this contract and must update this file in the same commit.

## Rules for every event

- The event name is the exact string shown, which is at most 50 characters.
- Data is sent with `window.umami.track(name, data)` through `track()`, never directly from a component.
- Data fields are the ones listed for that event and no others. Any other field is a validation error in tests, not sent.
- Values are strings or numbers only. Strings are at most 500 characters. Numbers have at most 4 decimal places.
- An event is sent only after its action has succeeded (FR-004).
- No event carries a name, email address, mood value, mood note, body measurement, or any health detail (FR-005).

## Events

### `exercise demo watched`

- **Trigger**: the demo window for one exercise opens (`exercise-demo-button.tsx`, `openWindow`).
- **Data**:

| Field | Type | Example | Notes |
|-------|------|---------|-------|
| `exerciseId` | string, at most 100 characters | `"push-up"` | The content identifier of the exercise. Not personal. |

### `session plan requested`

- **Trigger**: a session plan request succeeds (`session-planner.tsx`, after `fetchPlan` returns a plan).
- **Data**: none.

### `suggestion requested`

- **Trigger**: a new suggestion is shown after "another idea" (`home-experience.tsx`).
- **Data**: none.

### `mood selected`

- **Trigger**: the user selects a mood (`mood-stack.tsx`).
- **Data**: none. The mood value is deliberately not sent (FR-005).

## Not in this catalog

These were named in `spec.md` but have no matching product action yet. They must not be added until the action exists and the spec is updated.

- `session started`, `session completed`: no start or finish control exists.
- `mood check-in saved`: moods are not persisted; `mood selected` is the closest action.

## Identity call (not an event)

`umami.identify(distinctId)` is called once per authenticated page mount, with the value defined in `data-model.md`. It carries no other data.

## Verification

- Unit tests (`tests/unit/analytics/event-catalog.test.ts`) assert that each name is at most 50 characters, that unknown fields are rejected, and that no field name matches the personal-data denylist (`email`, `name`, `mood`, `note`, `weight`, `measurement`).
