# Contract: Paltrain MCP Tools

**Feature**: 008-openai-mcp-login | **Endpoint**: `/mcp` (see `http-endpoints.md`)

Three read-only tools. Each tool requires a valid access token with the granted scope and an active connection (see `data-model.md`, access rule). All inputs are validated at the boundary; invalid input returns a tool error that names the invalid field and lists valid values where applicable.

Every successful response contains only the data described here. No response contains an email address, a sign-in identifier, a mood history, or a token.

## Tool: `list_focus_areas`

- **Purpose**: Lets the user see which muscle-group focus areas exist.
- **Input**: none.
- **Output**: a list, each item with:
  - `id`: string, a focus area identifier (for example `legs`).
  - `label`: string, the display name.
- **Errors**: `unavailable` when the library cannot be loaded ("The exercise library is temporarily unavailable. Try again shortly.").

## Tool: `list_exercises`

- **Purpose**: Lists the exercises for one focus area.
- **Input**:
  - `focus`: required, one of the `id` values from `list_focus_areas`.
- **Output**: a list, each item with:
  - `id`, `name`, `description` (string or null), `minutes` (number), `intensity` (`low`, `moderate`, or `high`), `equipment` (list of strings), `caution` (string or null).
- **Errors**:
  - `invalid_focus`: lists the valid focus ids.
  - `unavailable`: as above.

## Tool: `plan_session`

- **Purpose**: Returns a session plan matching the app's planner for the same inputs (spec FR-011).
- **Input**:
  - `mood`: optional, one of the app's mood ids (for example `energized`, `calm`). Omit for no mood.
  - `focus`: optional, one focus id. Omit for no focus.
  - `minutes`: required, an integer from 10 to 90, in steps of 5. The planner's shortest and longest allowed values.
- **Output**:
  - `exercises`: list, same item shape as `list_exercises`.
  - `totalMinutes`: number.
  - `shortfallMessage`: string or null. The same notice the app shows when the session is shorter than requested.
  - `medicalNotice`: string. The same safety text the app shows with plans.
- **Errors**:
  - `invalid_mood`: lists the valid mood ids.
  - `invalid_focus`: lists the valid focus ids.
  - `invalid_minutes`: states the allowed range and step.
  - `unavailable`: as above.

## Common error shape

Each tool error returns a message a user can read and a machine-readable `code` from the lists above. Messages never include tokens, identifiers, or personal data.

## Verification

- Contract tests (`tests/unit/mcp/tools.test.ts`) check each input rule and each error code.
- Integration tests (`tests/integration/mcp/mcp-route.test.ts`) check that `plan_session` returns the same exercises as the app's planner for the same inputs (spec SC-005).
