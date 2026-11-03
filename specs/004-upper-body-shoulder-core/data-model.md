# Data Model: Upper Body, Shoulder, and Core Options

No database tables change. All entities are static content, or a review record.

## FocusArea (existing type, three new values)

| Field | Type | Rules |
|---|---|---|
| `id` | FocusId | One of the existing ids plus `upper-body`, `shoulders`, `core`. Closed enum. |
| `label` | string | "Upper body", "Shoulders", "Core". |
| `description` | string | One sentence, see plan Design Notes. |

## Routine (static content, `content/templates/*.json`)

Unchanged schema. Relevant rules:

| Field | Rules |
|---|---|
| `id` | Pattern `<focus>-NNN`. For the new areas: `upper-body-001`, `shoulders-001`, `core-001`. |
| `focus` | One focus id. Exactly one (FR-006). |
| `moods` | 1 to 4 mood ids. |
| `duration_minutes` | Integer 10 to 90. |
| `intensity` | `low`, `moderate`, or `high`. Exactly one (FR-004). |
| `equipment` | At least 1 entry. |
| `description` | 1 to 300 characters. |
| `caution` | Required when `intensity` is `high` (FR-005). |

## Exercise (static content, `content/exercises/*.json`)

Unchanged schema from feature 003. Same level and caution rules as routines.

## LevelCheckRecord (review record, `specs/004-upper-body-shoulder-core/level-check.md`)

| Field | Type | Rules |
|---|---|---|
| `item_id` | string | An existing routine or exercise id. |
| `kind` | "routine" \| "exercise" | Which file it is in. |
| `previous_level` | IntensityLevel | The level before this feature. |
| `assigned_level` | IntensityLevel | The level after the check. Equal to `previous_level` when unchanged. |
| `reason` | string | One sentence citing the rubric, for example "Explosive jump, rubric high." |
| `changed` | boolean | True when `assigned_level` differs from `previous_level`. |
| `needs_review` | boolean | True for every changed row. |

Every existing routine and exercise has one record (SC-003).

## Relationships

- Each routine belongs to one focus area. Each exercise belongs to one focus area.
- A LevelCheckRecord refers to one routine or exercise by id.

## State transitions

None. Levels are static. A correction is a content edit followed by a content check.
