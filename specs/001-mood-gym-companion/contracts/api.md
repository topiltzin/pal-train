# API Contract: Mood-Based Gym Companion

**Feature**: [spec.md](../spec.md) | **Data model**: [data-model.md](../data-model.md)

The browser talks to these JSON endpoints. Every response uses the shared envelope below. Auth
pages (`/auth/login`, `/auth/logout`, `/auth/callback`) are provided by the Auth0 SDK and are not
part of this contract.

## Response envelope

Every JSON response has this shape (user rule: consistent API envelope):

```json
{
  "success": true,
  "data": {},
  "error": null,
  "meta": null
}
```

- `success`: boolean.
- `data`: the payload on success, `null` on error.
- `error`: `null` on success, otherwise `{ "code": string, "message": string }`. Messages are safe to
  show to users; details go to server logs only (constitution I).
- `meta`: `null` except for lists, where it is `{ "total": number, "limit": number, "offset": number }`.

## Error codes

| Code | HTTP status | Meaning |
|------|-------------|---------|
| `UNAUTHENTICATED` | 401 | No valid session. Returned by every endpoint when the visitor is signed out (FR-012). |
| `INVALID_INPUT` | 400 | Request body or query failed validation. |
| `NOT_FOUND` | 404 | Unknown template or focus area. |
| `LIBRARY_UNAVAILABLE` | 503 | Template content could not be loaded (FR-014). |
| `INTERNAL` | 500 | Unexpected failure. The message is generic. |

## Endpoints

All endpoints require a signed-in session (FR-012). All return `Content-Type: application/json`.

### GET /api/me

Returns the signed-in user for the greeting (FR-018).

**Response 200 `data`**:

```json
{ "id": "auth0|abc123", "displayName": "Sam", "email": "sam@example.com" }
```

### GET /api/moods

Returns the mood options (FR-001) and the buddy line for each.

**Response 200 `data`**:

```json
[
  { "id": "energized", "label": "Energized", "buddyLine": "Let's go, you've got fuel!", "intensityRange": "high" }
]
```

### GET /api/focus-areas

Returns the focus areas (FR-002).

**Response 200 `data`**:

```json
[
  { "id": "chest", "label": "Chest", "description": "Pressing and chest work." }
]
```

### POST /api/suggestions

Returns one to three workout ideas for a mood, a focus area, or both (FR-004, FR-007). At least one
of `mood` or `focus` is required.

**Request body**:

```json
{ "mood": "energized", "focus": "legs" }
```

- `mood`: optional, a Mood `id`.
- `focus`: optional, a Focus Area `id`.
- Both omitted: `400 INVALID_INPUT`.

**Response 200 `data`**:

```json
{
  "partial": false,
  "suggestions": [
    {
      "id": "legs-004",
      "name": "Tempo squats and lunges",
      "focus": "legs",
      "moods": ["energized", "focused"],
      "durationMinutes": 30,
      "intensity": "high",
      "equipment": ["dumbbells"],
      "description": "A steady, controlled set to wake your legs up.",
      "caution": "Keep your knees tracking over your toes."
    }
  ]
}
```

- `partial`: `true` when no template matches the full selection and the closest matches are
  returned (User Story 2, scenario 3).
- The response updates `suggestion_state.last_template_id` for the user to the last suggestion
  returned.
- `400 INVALID_INPUT` for an unknown mood or focus. `503 LIBRARY_UNAVAILABLE` when content fails to
  load (FR-014).

### POST /api/suggestions/next

Returns a different suggestion for the same selection (FR-007). The request repeats the previous
selection so the server stays stateless about the selection itself.

**Request body**: same as `POST /api/suggestions`.

**Response 200 `data`**: same shape as `POST /api/suggestions`. The first suggestion never equals the
user's `last_template_id` unless it is the only match (FR-008).

### GET /api/templates

Browses the full template list for a focus area, with filters (FR-009).

**Query parameters**:

| Name | Required | Rule |
|------|----------|------|
| `focus` | yes | Focus Area `id` |
| `intensity` | no | `low`, `moderate`, or `high` |
| `maxMinutes` | no | Integer from 10 to 90 |
| `limit` | no | Integer from 1 to 50. Default 20. |
| `offset` | no | Integer, at least 0. Default 0. |

**Response 200 `data`**: an array of templates in the suggestion shape. `meta` holds the paging
totals.

**Errors**: `400 INVALID_INPUT` for a bad parameter; `404 NOT_FOUND` for an unknown focus area.

### GET /api/templates/{id}

Returns one template by `id` (used by the library detail view).

**Response 200 `data`**: one template in the suggestion shape.

**Errors**: `404 NOT_FOUND` for an unknown `id`.

## Compatibility rules

- Field names are camelCase on the wire. Data model names are snake_case in the database.
- Adding a field is non-breaking. Removing or renaming a field requires a version note in the
  plan and a migration of the client in the same change.
- Template `id` values are stable once published. Suggestions and `last_template_id` depend on them.
