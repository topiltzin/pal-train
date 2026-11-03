# Data Model: Session Length Range

No database tables change. All entities are static content or in-memory values for one request.

## Exercise (static content, `content/exercises/*.json`)

| Field | Type | Rules |
|---|---|---|
| `id` | string | Pattern `<focus>-<NNN>`, unique across all files (example: `legs-014`). |
| `name` | string | 3 to 60 characters. |
| `focus` | FocusId | One of the existing focus areas. |
| `moods` | MoodId[] | 1 to 4 moods. |
| `minutes` | integer | 1 to 30. The planned time for this exercise, rest included. |
| `intensity` | "low" \| "moderate" \| "high" | Existing intensity levels. |
| `equipment` | string[] | At least 1 entry. Use `"none"` for bodyweight. |
| `caution` | string, optional | Required when `intensity` is `"high"`. Same rule as routine templates. |

Validation runs at load time and in `scripts/validate-content.ts`. Invalid files fail the build, the same as templates.

## SessionLengthRange (value, not stored)

| Field | Type | Rules |
|---|---|---|
| `minMinutes` | integer | 10 to 90, multiple of 5, at most `maxMinutes`. |
| `maxMinutes` | integer | 10 to 90, multiple of 5, at least `minMinutes`. |

Defaults: `minMinutes = 30`, `maxMinutes = 60`. Not persisted.

## SessionPlan (response value, not stored)

| Field | Type | Meaning |
|---|---|---|
| `exercises` | ExerciseView[] | Ordered, unique by id. |
| `totalMinutes` | integer | Sum of `minutes`. Always at most `maxMinutes`. |
| `targetCount` | integer | Count from the exercise count rule, for display and tests. |
| `partial` | boolean | True when the plan could not fully meet the range or the mood and focus filter. |
| `shortfallMessage` | string or null | Set when `partial` is true. |

## ExerciseView (API output)

Same as Exercise minus internal fields, plus nothing else. Output omits no fields today, but the view type exists so internal fields can be hidden later without changing the contract.

## Relationships

- Each Exercise belongs to one focus area and one or more moods.
- A SessionPlan selects Exercises. It refers to no stored records.
- Existing Templates and their suggestion state are unaffected.

## State transitions

None. Plans are recomputed on each request. There is no "last shown" tracking in this version, since the spec does not require it.
