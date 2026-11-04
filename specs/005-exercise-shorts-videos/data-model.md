# Data Model: Exercise Demo Shorts

**Feature**: 005-exercise-shorts-videos | **Date**: 2026-11-04

## Entity: Exercise (existing, unchanged)

Exercises stay in the bundled content files under `content/exercises/`. They are identified by their existing `id` (for example `chest-001`). This feature adds no fields to them (spec FR-012).

## Entity: Exercise Demo Link (new)

Table: `exercise_demo_links`

| Column | Type | Null | Default | Rule |
|--------|------|------|---------|------|
| `id` | integer identity | no | generated | Primary key. |
| `exercise_id` | text | no | none | Must equal an existing exercise `id`. Not a foreign key, because exercises live in content files, not in a table. |
| `video_id` | varchar(11) | no | none | Must match `^[A-Za-z0-9_-]{11}$` (CHECK constraint). |
| `source_title` | text | no | none | The Short's title as shown on the channel. 1 to 200 characters (CHECK constraint). |
| `channel` | text | no | `'officialdemic'` | The channel the Short came from. |
| `active` | boolean | no | `true` | Exactly one row per `exercise_id` may be active. |
| `added_at` | timestamptz | no | `now()` | When the link was stored. |

**Constraints and indexes**
- Primary key on `id`.
- Partial unique index `exercise_demo_links_one_active` on `(exercise_id)` where `active = true`. Enforces FR-006.
- CHECK `video_id` format; CHECK `source_title` length.

**State rules**
- Adding a link for an exercise that already has an active link: in one transaction, set the old row's `active` to false, then insert the new row with `active = true`. The newest link wins (spec User Story 2, scenario 3).
- Removing a link: set `active = false`. Rows are kept for history; the exercise then has no demo.

## Read model: DemoView (returned to the page)

```text
DemoView = { videoId: string, title: string }
```

Returned as `demo` on each exercise in the session-plan response, or `null` when the exercise has no active link (or the lookup failed). `channel`, `added_at`, and `id` are not returned to the page.

## Import input: demo-links.reviewed.csv

Created during tasks. One row per reviewed Short.

| Column | Meaning |
|--------|---------|
| `exercise_id` | Exercise the Short demonstrates. |
| `video_id` | The Short's 11-character id, taken from its `/shorts/` URL. |
| `source_title` | The title as shown on the channel. |
| `decision` | `accept` to import, `reject` to skip. |
| `note` | Reviewer's reason, for example "title names the same movement". |

The import script reads only `accept` rows and calls the repository's upsert, which applies the one-active-link rule.

## Validation rules (from the spec)

- FR-005: every stored link has an exercise id, video id, source title, channel, and added date.
- FR-006: at most one active link per exercise.
- FR-007: a value that fails the video id rule is never returned as a demo.
- FR-010: only Shorts whose title names the exercise's movement are accepted in the CSV.
