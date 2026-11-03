# Contract: Content Files for the New Areas

Shape of the JSON files added under `content/templates/` and `content/exercises/`. Both are validated at load time by the existing schemas. No new schema is added.

## File names

- `content/templates/upper-body.json`, `content/templates/shoulders.json`, `content/templates/core.json`
- `content/exercises/upper-body.json`, `content/exercises/shoulders.json`, `content/exercises/core.json`

## Routine file

A JSON array of routine objects, following `src/features/library/template.schema.ts`:

```json
[
  {
    "id": "shoulders-001",
    "name": "Band external rotation",
    "focus": "shoulders",
    "moods": ["calm", "tired"],
    "duration_minutes": 10,
    "intensity": "low",
    "equipment": ["resistance band"],
    "description": "Slow external rotations with the elbow pinned to the side."
  }
]
```

## Exercise file

A JSON array of exercise objects, following `src/features/sessions/exercise.schema.ts`. Same fields as above, except `duration_minutes` is `minutes` (integer 1 to 30).

## Rules that apply to every entry

- `focus` matches the file's area.
- `intensity` is exactly one of `low`, `moderate`, `high`.
- `high` entries include a non-empty `caution`.
- Ids are unique across all files and follow `<focus>-NNN`.
- Each area file contains at least 8 routines (at least 2 at each level) and at least 10 exercises.
