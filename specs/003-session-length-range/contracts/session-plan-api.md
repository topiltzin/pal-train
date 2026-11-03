# Contract: POST /api/session-plan

Plans a session of exercises whose total time falls inside a minimum and maximum length.

## Authentication

Requires a signed-in user, as `POST /api/suggestions` does. Unauthenticated calls return the same auth error the suggestions route returns.

## Request

`Content-Type: application/json`

```json
{
  "minMinutes": 30,
  "maxMinutes": 45,
  "mood": "energized",
  "focus": "legs"
}
```

| Field | Required | Rules |
|---|---|---|
| `minMinutes` | yes | Integer, 0 to 90, multiple of 5, at most `maxMinutes`. The app sends 0. |
| `maxMinutes` | yes | Integer, 10 to 90, multiple of 5, at least `minMinutes`. |
| `mood` | no | One of the existing mood ids. |
| `focus` | no | One of the existing focus ids. |

At least one of `mood` or `focus` is required, matching the suggestions route. Any other body is `INVALID_INPUT`.

## Success response (200)

```json
{
  "success": true,
  "data": {
    "exercises": [
      {
        "id": "legs-014",
        "name": "Goblet squat",
        "focus": "legs",
        "minutes": 8,
        "intensity": "moderate",
        "equipment": ["dumbbell"],
        "caution": null
      }
    ],
    "totalMinutes": 42,
    "targetCount": 6,
    "partial": false,
    "shortfallMessage": null
  },
  "error": null,
  "meta": null
}
```

Guarantees:
- `totalMinutes` is at most `maxMinutes`. `minMinutes` is a best-effort target: the plan does not add exercises only to reach it.
- `exercises` has at least 3 entries unless `partial` is true.
- `exercises` contains no duplicate ids.
- `exercises` is empty only when nothing fits, and then `partial` is true.
- `shortfallMessage` is a string when `partial` is true (the plan is shorter than asked) or when some exercises match only the mood or only the focus. It is null otherwise.
- Exercises with `intensity: "high"` include a non-null `caution`.

## Error responses

Uses the standard envelope (`success: false`, `data: null`, `error: { code, message }`).

| Case | Code | Message |
|---|---|---|
| Body is not JSON | `INVALID_INPUT` | "Send the request as JSON." |
| Range out of bounds, not a multiple of 5, or min above max | `INVALID_INPUT` | First validation message, for example "Pick a length between 10 and 90 minutes." |
| Neither mood nor focus | `INVALID_INPUT` | "Pick a mood, a focus area, or both." |
| Exercise data failed to load | `LIBRARY_UNAVAILABLE` | Same message as the suggestions route. |
| Not signed in | existing auth error | Unchanged. |

## Versioning

New endpoint. No existing clients change.
