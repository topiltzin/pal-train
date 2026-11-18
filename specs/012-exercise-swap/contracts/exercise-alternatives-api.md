# Contract: Exercise Alternatives API

Used by the workout plan page to list the same-type exercises a card can be swapped for. It follows the existing response envelope (`ok` / `errorResponse`) and the same sign-in rule as `POST /api/session-plan`.

## Endpoint

`POST /api/exercise-alternatives`

Request must be JSON (`content-type: application/json`). A signed-out request is refused the same way `/api/session-plan` refuses it.

## Request body

```json
{
  "exerciseId": "biceps-004",
  "currentExerciseIds": ["biceps-004", "chest-002", "legs-001"],
  "minMinutes": 15,
  "maxMinutes": 20
}
```

| Field | Type | Required | Rule |
|-------|------|----------|------|
| `exerciseId` | string | yes | A library id. |
| `currentExerciseIds` | string[] | yes | 1 to 15 library ids (`MAX_EXERCISES`). Must include `exerciseId`. |
| `minMinutes` | integer | yes | Same range rules as `/api/session-plan`. |
| `maxMinutes` | integer | yes | Same range rules as `/api/session-plan`. Not below `minMinutes`. |

## Success response (200)

```json
{
  "success": true,
  "data": {
    "exerciseId": "biceps-004",
    "focus": "biceps",
    "options": [
      {
        "exercise": {
          "id": "biceps-002",
          "name": "Hammer curl",
          "description": "Curl with palms facing each other to work the biceps and forearms.",
          "focus": "biceps",
          "minutes": 6,
          "intensity": "moderate",
          "equipment": ["dumbbell"],
          "caution": null,
          "demo": null
        },
        "available": true,
        "unavailableReason": null
      }
    ]
  },
  "error": null
}
```

Rules for `options`:
- Only exercises with the same `focus` as `exerciseId`.
- Never includes `exerciseId` or any id in `currentExerciseIds`.
- In library order.
- `available: false` with `unavailableReason: "over_length"` when the total minutes after the swap would fall outside `minMinutes`..`maxMinutes`. The total is `sum(minutes of currentExerciseIds)` with `exerciseId` replaced by the option.
- `options` may be empty. It is not an error.

## Error responses

| Condition | Code | Message |
|-----------|------|---------|
| Body is not JSON | INVALID_INPUT | "Send the request as JSON." |
| Field fails validation | INVALID_INPUT | First validation message, in the same style as `/api/session-plan`. |
| `exerciseId` not in the library | INVALID_INPUT | "That exercise is not in the library." |
| `exerciseId` not in `currentExerciseIds` | INVALID_INPUT | "Swap an exercise that is in the plan." |
| Library cannot be loaded | LIBRARY_UNAVAILABLE | "The exercise library could not be loaded." |
| Other failure | Standard route error response | Logged on the server with context. |

## Notes for the card UI

- Demo lookup failures do not fail the request. Affected options have `demo: null` (FR-011).
- The client disables swap controls while the workout timer runs (FR-009). The server does not check the timer.
