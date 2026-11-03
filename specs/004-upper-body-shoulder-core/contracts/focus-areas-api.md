# Contract: GET /api/focus-areas

Lists the muscle group options. This feature adds three entries to the existing list.

## Authentication

Unchanged. Requires a signed-in user.

## Response (200)

```json
{
  "success": true,
  "data": [
    { "id": "chest", "label": "Chest", "description": "Pressing and chest work." },
    { "id": "upper-body", "label": "Upper body", "description": "Pressing and pulling work for the arms and torso that is not specific to chest or back." },
    { "id": "shoulders", "label": "Shoulders", "description": "Deltoid and rotator-cuff work." },
    { "id": "core", "label": "Core", "description": "Trunk stability, bracing, and rotation." }
  ],
  "error": null,
  "meta": null
}
```

Guarantees:
- The list has 13 entries: the 10 existing areas plus `upper-body`, `shoulders`, and `core`.
- Each entry has `id`, `label`, and `description`. Ids are unique.
- Existing entries keep their ids, labels, and order. New entries are appended after `stretching`.

## Errors

Unchanged. `UNAUTHENTICATED` when signed out.

## Versioning

Additive change. Existing clients that ignore unknown ids keep working. Clients that expected exactly 10 options must accept 13.
