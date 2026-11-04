# Contract: Session plan response (additive change)

**Endpoint**: `POST /api/session-plan` (unchanged request)

## Change

Each item in `data.exercises` gains one field:

```json
{
  "id": "chest-001",
  "name": "Push-up",
  "focus": "chest",
  "minutes": 8,
  "intensity": "moderate",
  "equipment": ["none"],
  "caution": null,
  "demo": { "videoId": "IFzYdoNYJkY", "title": "Bench Press Mistakes You Should Avoid" }
}
```

- `demo` is `null` when the exercise has no active demo link, or when the demo lookup failed. The plan itself still succeeds.
- `demo.videoId` is an 11-character YouTube id. `demo.title` is the Short's channel title, for the dialog heading and the fallback link text.
- No other field changes. The envelope (`success`, `data`, `error`) is unchanged.

## Compatibility

Additive. Clients that ignore unknown fields are unaffected. Existing error responses are unchanged.

## Errors

No new error codes. A database failure during the demo lookup is not an error response; it appears as `demo: null` and is logged server-side with the request context.
