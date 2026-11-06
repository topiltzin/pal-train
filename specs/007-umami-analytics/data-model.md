# Data Model: Umami Web Analytics

**Feature**: 007-umami-analytics | **Date**: 2026-11-05

This feature adds no tables to the app's database. Analytics records live in the self-hosted Umami database, which the app writes to only through the tracker. The entities below describe what the app produces and validates.

## Analytics Configuration (environment, server only)

Read once by `analytics-env.ts`. All-or-nothing: either none of these is set (analytics off) or all are set and valid.

| Field | Required when enabled | Rule |
|-------|-----------------------|------|
| `UMAMI_SCRIPT_URL` | Yes | Absolute `https` URL of the Umami tracker script on the self-hosted instance. |
| `UMAMI_WEBSITE_ID` | Yes | UUID of the website registered in Umami. |
| `ANALYTICS_HASH_SECRET` | Yes | At least 32 characters. Used only for the identity hash; never sent to the browser. |

Derived, not stored: `data-domains` is the hostname of `APP_BASE_URL` (already required by the app).

## Analytics Identity

Represents one signed-in user to analytics. Never stored; computed per request in the authenticated layout.

| Field | Type | Rule |
|-------|------|------|
| `distinctId` | string, 40 hex characters | `HMAC-SHA256(ANALYTICS_HASH_SECRET, users.id)`, truncated to 40 characters. Stable per user, opaque, at most 50 characters (Umami's limit). |

Source: `users.id` (the Auth0 subject). This value must never be sent raw. Email, display name, and any health value are excluded by construction: they are not inputs to the hash.

**State**: Anonymous (no identity) → Identified (after the authenticated layout mounts `UmamiIdentify`) → Anonymous again after sign-out, which is a full page load.

## Tracked Event

A named action with a fixed, validated data shape, defined in `event-catalog.ts` and documented in `contracts/event-catalog.md`.

| Field | Type | Rule |
|-------|------|------|
| `name` | literal from the catalog | At most 50 characters. Only catalog names may be sent. |
| `data` | object of allowed fields only | Each allowed field is typed; strings at most 500 characters; numbers at most 4 decimal places. Unknown or personal fields are rejected. |

Catalog entries (see contract): `exercise demo watched`, `session plan requested`, `suggestion requested`, `mood selected`.

## Page View

Recorded by Umami automatically. Not modeled in app code.

Fields Umami collects by default: `hostname`, `language`, `referrer`, `screen`, `title`, `url`, `website`. Query strings are excluded by configuration (`data-exclude-search`). The `url` value is the path without query parameters.

## Validation rules (from spec requirements)

- FR-005: the catalog schema has no field for names, emails, mood values, notes, or measurements. Adding one requires a spec change.
- FR-004: events are sent only after the action succeeds, so the call site is the success path.
- FR-010: the three configuration fields are read from the environment, never from source.
