# Contract: Tracker Configuration

**Feature**: 007-umami-analytics | **Rendered by**: `src/components/analytics/umami-script.tsx`

This is the contract between the app and the Umami tracker script. It fixes which environment variables are read and which script attributes are set. Changing any attribute or variable is a change to this contract.

## Environment variables (server only)

| Variable | Required when enabled | Purpose |
|----------|-----------------------|---------|
| `UMAMI_SCRIPT_URL` | Yes | Tracker script URL on the self-hosted instance, for example `https://analytics.<domain>/script.js`. |
| `UMAMI_WEBSITE_ID` | Yes | Website UUID from Umami. |
| `ANALYTICS_HASH_SECRET` | Yes | Secret for the identity hash (at least 32 characters). Never exposed to the browser. |

Enabled means at least one of these is set. If one is set and another is missing or invalid, the app fails at startup and names the missing variables. If none is set, analytics is off.

No variable here is prefixed `NEXT_PUBLIC_`, so none is bundled into client code.

## Script attributes

Rendered on the Umami script tag, loaded with `next/script` and `strategy="afterInteractive"`.

| Attribute | Value | Why |
|-----------|-------|-----|
| `src` | `UMAMI_SCRIPT_URL` | Self-hosted tracker. |
| `data-website-id` | `UMAMI_WEBSITE_ID` | Identifies the site. |
| `data-domains` | hostname of `APP_BASE_URL` | Excludes localhost, previews, and other hosts from production reporting (FR-011). |
| `data-do-not-track` | `"true"` | Honors the browser Do Not Track signal (FR-003). |
| `data-exclude-search` | `"true"` | Query strings are not collected (privacy). |

Not set, and why:
- `data-distinct-id`: the identity is set after load by `umami.identify()` from the authenticated layout, so the root layout does not need the session (see research §4).
- `data-auto-track`: left at its default, so page views and in-app navigation are tracked automatically (FR-001).
- `data-performance`, `data-errors`, `data-before-send`: not needed for the spec. Each would be a new requirement.

## Client calls

| Call | When | Source |
|------|------|--------|
| `umami.identify(distinctId)` | Once per authenticated page mount | `umami-identify.tsx` |
| `umami.track(name, data)` | On each catalog event | `track()` in `track.ts` |

All client calls go through `track()` or the identify component, which both check that `window.umami` exists first (FR-012). If the script is blocked or unreachable, calls do nothing and the app is unaffected (FR-009).

## Umami version

Deploy the latest 3.x release of the self-hosted instance, and record the version actually deployed in `quickstart.md`. The attributes above are present in Umami v3.x per the Umami docs.
