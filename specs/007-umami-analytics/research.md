# Research: Umami Web Analytics

**Feature**: 007-umami-analytics | **Date**: 2026-11-05

Each entry gives the decision, why it was made, and what was rejected. Items marked **SPIKE** must be verified in code before the task that depends on them is closed.

## 1. How the tracker loads

**Decision**: Render Umami's standard script tag through `next/script` with `strategy="afterInteractive"`, from the root layout (`src/app/layout.tsx`), so every page including the public sign-in page is tracked.

**Rationale**: The Umami docs recommend `next/script` for Next.js. `afterInteractive` keeps the script off the critical path (FR-008). The root layout is the only place that covers every route.

**Alternatives considered**: A `<script>` tag in `app/(app)/layout.tsx` only. Rejected: it would miss the sign-in page and the anonymous first visit. An npm wrapper package for one tag. Rejected: adds a dependency (constitution III).

**SPIKE 1 (resolved)**: Reading the Umami environment in the root layout does not make the route dynamic. Measured with `npm run build` under `cacheComponents: true`: `/sign-in` is still prerendered static (`○`) with analytics unset and with analytics configured, and the tracker tag appears in the prerendered `sign-in.html`. No Suspense boundary is needed. Caveat: the `UMAMI_*` values are baked in at build time, so changing them on Vercel requires a redeploy.

## 2. Hosting Umami

**Decision**: Self-host Umami with its official Docker image on a small server the team controls, with its own PostgreSQL database, separate from the app's Neon database. Serve it from a dedicated subdomain (for example `analytics.<domain>`).

**Rationale**: Keeps analytics data out of the app's database and under the team's control, which is the stated goal of the spec. Umami needs Node.js 20.19+ and PostgreSQL 12.14+, which a standard container covers. A separate database keeps analytics load and retention independent of the app.

**Alternatives considered**: Umami Cloud. Rejected: data leaves the team's control, and session replay and heatmaps are paid there. Umami on Vercel next to the app. Possible, but it couples analytics availability to the app's deploy pipeline and still needs its own database. Reusing the app's Neon database. Rejected: mixes concerns and ties analytics retention to app schema changes.

## 3. Identity: how a signed-in user is represented

**Decision**: Compute `HMAC-SHA256(ANALYTICS_HASH_SECRET, auth0_sub)` on the server and send the first 40 hex characters as the Umami distinct ID.

**Rationale**: `users.id` is the Auth0 subject. Sending it raw would let anyone with analytics access correlate events with an Auth0 account. A keyed hash is stable for one user, so returning-user linking still works (US3), but it cannot be reversed without the secret. Forty hex characters is 160 bits, inside Umami's 50-character limit; a full SHA-256 hex digest (64 characters) would exceed it.

**Alternatives considered**: Sending `users.id` directly. Rejected: exposes the account identifier. Unkeyed SHA-256. Rejected: recomputable by anyone who knows the subject format. Hashing the email. Rejected: email is personal data under the spec, even hashed.

## 4. When the identity is set

**Decision**: Pass the hashed ID from the authenticated layout (`app/(app)/layout.tsx`, where the user is already loaded) to a small client component that calls `umami.identify(hashedId)` once on mount.

**Rationale**: The authenticated shell already resolves the signed-in user, so no extra session call is needed. `identify` after load is a documented Umami call. Setting `data-distinct-id` on the root script would require reading the session in the root layout, which would make every page dynamic.

**Alternatives considered**: `data-distinct-id` on the root script. Rejected for the reason above. Identify on every render. Rejected: unnecessary calls; once per mount is enough.

## 5. Ending linkage on sign-out

**Decision**: Rely on sign-out being a full navigation. The sign-out link goes to `/auth/logout` (`src/features/navigation/app-nav-items.ts`), which reloads the page, so the next page load starts with no identity.

**Rationale**: Simplest correct behavior for FR-007, with no custom clearing logic.

**SPIKE 2 (resolved)**: The distinct ID is held in memory only. Read from the Umami tracker source (`src/tracker/index.ts` on the `master` branch of `umami-software/umami`): the ID is read once from `data-distinct-id` at load, kept in a closure variable, and never written to `localStorage`, `sessionStorage`, or a cookie. The only storage access is a read of `umami.disabled`. Nothing clears it except a full page load. Consequence: sign-out (a full navigation to `/auth/logout`) already ends linkage, so no clear step is needed. Caveat: this is the `master` source, not necessarily the version a given deployment runs; re-check when upgrading Umami.

## 6. Which events, and where they fire

**Decision**: Four events, each fired once per completed user action, from the component that already performs the action:

| Event name | Fired from | Data sent |
|------------|------------|-----------|
| `exercise demo watched` | `exercise-demo-button.tsx`, in `openWindow` | `exerciseId` |
| `session plan requested` | `session-planner.tsx`, after the plan request succeeds | none |
| `suggestion requested` | `home-experience.tsx`, when "another idea" succeeds | none |
| `mood selected` | `mood-stack.tsx`, on selection | none (no mood value, per FR-005) |

**Rationale**: These are the actions that exist in the app today. Firing on success follows FR-004. Mood selection sends no value, the strictest reading of FR-005, and the only option consistent with the app, since moods are not saved. Plan requests send no length value, to keep the payload minimal; length can be added later if the team needs it.

**Alternatives considered**: Server-side events from API routes. Rejected for now: Umami's server API needs a valid User-Agent and extra plumbing, and client events cover the same actions. Start and finish session events. Rejected: the controls do not exist (see plan, Spec Gaps).

## 7. Keeping development and test traffic out

**Decision**: Set `data-domains` to the hostname of `APP_BASE_URL`, which is already a required environment variable.

**Rationale**: Localhost, previews, and other hosts are excluded from production reporting (FR-011) without a new setting.

**Alternatives considered**: A separate `UMAMI_DOMAINS` variable. Rejected as speculative (constitution III): `APP_BASE_URL` already encodes the production host.

**Note**: Preview deployments on other hostnames will be excluded from reporting. This is intended.

## 8. Do Not Track and cookies

**Decision**: Keep Umami's defaults: no cookies. Set `data-do-not-track="true"` so the browser's DNT signal is honored (FR-002, FR-003). Set `data-exclude-search="true"` so query strings, which can carry personal values, are not collected.

**Rationale**: Matches the spec's privacy requirements with documented attributes and no custom code.

**Alternatives considered**: Collecting query strings. Rejected: they can carry personal data from links. A consent banner. Rejected per the spec's assumption, since no cookies are set; revisit if other trackers are added.

## 9. Configuration and failure behavior

**Decision**: Read analytics configuration in a separate, optional parser (`analytics-env.ts`):
- If none of the analytics variables is set, analytics is off and nothing is rendered.
- If any is set, all required ones must be valid, or the app fails at startup with a message naming the missing variables.

**Rationale**: The existing `env.ts` requires every variable for the whole app, which would make analytics mandatory for local development and the test run. A separate, all-or-nothing parser satisfies FR-009, FR-010, and constitution principle I (required secrets validated at startup).

**Alternatives considered**: Adding Umami variables to the existing required schema. Rejected: would break the app wherever analytics is not deployed. Silently disabling on partial configuration. Rejected: a half-configured deploy would go unnoticed.

## 10. Server-render safety and the client wrapper

**Decision**: `track()` checks that `window` and `window.umami` exist before calling. Nothing runs during server rendering.

**Rationale**: FR-012. Umami's global exists only in the browser, and the guard keeps unit tests free of a real tracker.

**Alternatives considered**: A `useEffect` at each call site only. Rejected: a guard in one place is smaller and harder to forget.

## 11. Ad blockers

**Decision**: Out of scope for this feature. Umami offers a custom script path and collect endpoint to reduce blocking.

**Rationale**: The spec records blocked visitors as an accepted limitation and lists the custom path as a follow-up.

## Open items

- SPIKE 1: root layout rendering under `cacheComponents`.
- SPIKE 2: where the distinct ID persists, and whether clearing is needed on sign-out.
- Deploy-time: pin the Umami version. Use the latest 3.x release available at deploy time and record it in `quickstart.md`.
