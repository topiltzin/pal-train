# Data Model: Mood-Based Gym Companion

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Research**: [research.md](./research.md)

Two persisted tables (Neon Postgres) and three content types held in repository files. No health or
medical data is stored anywhere (FR-012).

## Persisted entities

### User (`users`)

Represents a signed-in person. The Auth0 subject is the stable identifier.

| Field | Type | Rules |
|-------|------|-------|
| `id` | text, primary key | Auth0 `sub` claim. Immutable. |
| `email` | text, unique, not null | From the Auth0 profile. Validated as an email at the boundary. |
| `display_name` | text, not null | Shown in the greeting (FR-018). Max 40 characters; default is the local part of the email. |
| `created_at` | timestamp, not null | Set on first sign-in. |

**Validation**: `display_name` is trimmed, 1 to 40 characters. A missing name falls back to the
email local part, never an empty greeting.

**Lifecycle**: created on first successful sign-in (upsert by `id`). No deletion flow in version 1.

### Suggestion State (`suggestion_state`)

Remembers the last template shown to a user, so the next suggestion can avoid an immediate repeat
(FR-008, research §9).

| Field | Type | Rules |
|-------|------|-------|
| `user_id` | text, primary key, FK to `users.id` | One row per user. |
| `last_template_id` | text, nullable | Template `id` from the content library. Null before the first suggestion. |
| `updated_at` | timestamp, not null | Set on every update. |

**Lifecycle**: upserted on each suggestion request. Deleted with the user (cascade).

## Content types (repository files, not persisted)

These are defined by zod schemas and loaded from `content/`. They are read-only at runtime.

### Mood

A fixed set of eight moods. FR-001 requires at least seven named moods; `calm` is the eighth.

| Field | Type | Rules |
|-------|------|-------|
| `id` | enum | One of: `energized`, `tired`, `stressed`, `focused`, `playful`, `unmotivated`, `want-to-sweat`, `calm` |
| `label` | string | Display name, for example "Energized" |
| `buddy_line` | string | The buddy's friendly line for this mood (FR-017) |
| `accent` | token name | Theme token the mood selects for the playful visual style (FR-017) |
| `intensity_range` | `low` \| `moderate` \| `high` | The intensity band this mood favors |

Defined in `src/features/moods/`. Changing the mood set is a content change, not a schema change.

### Focus Area

| Field | Type | Rules |
|-------|------|-------|
| `id` | enum | `chest`, `biceps`, `triceps`, `back`, `legs`, `cardio`, `hyrox-style`, `conditioning` |
| `label` | string | Display name |
| `description` | string | One short sentence |

**Rule**: each focus area must have at least 8 templates (FR-005). Enforced by a build-time test.

### Workout Template

Stored in `content/templates/<focus-id>.json`, an array of templates per focus area.

| Field | Type | Rules |
|-------|------|-------|
| `id` | string | Unique across all files. Pattern `<focus-id>-<nnn>`, for example `legs-004`. |
| `name` | string | 3 to 60 characters |
| `focus` | Focus Area `id` | Must match the file's focus area |
| `moods` | non-empty array of Mood `id` | Every mood must exist. Each template fits one to four moods. |
| `duration_minutes` | integer | 10 to 90 |
| `intensity` | `low` \| `moderate` \| `high` | Required (FR-006) |
| `equipment` | non-empty array of strings | Use `["none"]` for bodyweight. |
| `description` | string | 1 to 3 short sentences, friendly tone (FR-015) |
| `caution` | string, optional | Shown with the suggestion when present (FR-011). Required for `high` intensity with heavy lifts or high-impact cardio. |

**Validation**: all templates are validated by zod at build time. A failure fails the build, not
the page. Duplicate `id` values fail the build.

**Coverage invariant**: at least 100 templates in total (SC-003), and at least 8 per focus area
(FR-005, SC-002). Both are checked by an automated test.

## Relationships

```text
User 1 ── 0..1 SuggestionState
Mood  *  ── *  WorkoutTemplate   (a template fits one to four moods)
FocusArea 1 ── *  WorkoutTemplate
```

## State transitions

Suggestion selection has no persisted lifecycle beyond `last_template_id`. The selection rules are
pure functions in `src/features/suggestions/`:

1. Filter templates by the selected mood, focus area, or both (FR-004). The filter is an intersection
   when both are set.
2. Remove `last_template_id` from the candidates when another candidate exists (FR-008).
3. Return up to three templates in a stable random order.
4. If no template matches both, return the closest matches with `partial: true` (User Story 2,
   scenario 3).
