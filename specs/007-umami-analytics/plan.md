# Implementation Plan: Umami Web Analytics

**Branch**: `007-umami-analytics` | **Date**: 2026-11-05 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/007-umami-analytics/spec.md`

## Summary

Add a self-hosted Umami tracker to Paltrain so the team sees page views and a small set of named product events, and can link a signed-in user's activity through an opaque identifier. The tracker is a plain script loaded with `next/script` from the root layout. Events are recorded on the client at the points where the app already performs an action (demo opened, plan requested, suggestion requested, mood selected). The signed-in identifier is a keyed hash of the Auth0 subject, computed on the server, so no email, name, or raw account ID reaches analytics. When no Umami configuration is present, tracking is off and the app behaves exactly as today. No new npm package is added, and no new database table is needed in the app's database.

## Technical Context

**Language/Version**: TypeScript 5 on Node.js (Fluid Compute default runtime)

**Primary Dependencies**: Next.js 16.4.3 (App Router, `next/script`), React 19.3, zod 4 (already present). Umami itself is an external self-hosted service, not an npm dependency.

**Storage**: No new tables in the app's Neon Postgres. Umami stores its data in its own PostgreSQL database (Umami requires PostgreSQL 12.14 or newer; Node.js 20.19 or newer, 22 LTS recommended).

**Testing**: Vitest for unit tests (`tests/unit`, run with `npm test`), Playwright for end-to-end (`tests/e2e`), coverage target 80% per constitution.

**Target Platform**: Web application on Vercel, used in mobile and desktop browsers.

**Project Type**: Web application (Next.js App Router) with one external self-hosted analytics service.

**Performance Goals**: The tracker must not delay first useful display (FR-008, SC-004); it loads after the page is interactive. Event calls are fire-and-forget and must not add user-visible latency.

**Constraints**: No cookies (FR-002). Do Not Track honored (FR-003). No personal or health data in payloads (FR-005). Analytics configuration is optional at runtime and must never break the app when absent or when the service is down (FR-009, FR-010). Tracking is server-render safe (FR-012). Umami limits: event names at most 50 characters, distinct IDs at most 50 characters, string event data at most 500 characters.

**Scale/Scope**: One website, one production hostname, four event types, two root layouts touched, roughly six client components modified. Traffic scale is that of a small consumer app.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle / Gate | Status | How this plan complies |
|------------------|--------|------------------------|
| I. Code quality: names, under 50 lines, early returns, explicit errors | PASS | Each unit is a small named function. Config parse errors are explicit. |
| I. No secrets in source; required secrets validated at startup | PASS | The hash secret and website ID come from environment variables. If any analytics variable is set, all required ones are validated at startup, and the app fails loudly on a partial setup. |
| I. No mutation of incoming data; no debug output | PASS | Event payloads are built as new objects. No `console.log`. |
| II. Test-first, 80% coverage, AAA tests, deterministic, no real network in unit tests | PASS | Unit tests mock `window.umami`. The end-to-end test uses a stub tracker script, not the real service. |
| II. Three test levels where applicable | PASS | Unit (identity hash, event catalog, env parsing, track guard). Integration: none needed, because the feature adds no API routes or DB queries. End-to-end: page view script present and events fire on the existing flows. |
| III. Feature-organized folders; high cohesion | PASS | All new logic lives in `src/features/analytics/`. Components live in `src/components/analytics/`. |
| III. No speculative abstraction (YAGNI) | PASS | No generic analytics provider interface. One thin `track()` function wraps `window.umami`, because the global is optional and must be guarded for server render and tests. |
| III. New third-party dependency must be justified | PASS | No npm dependency is added. Umami is loaded as the self-hosted script. |
| Quality gate: dedicated security review for user data and external calls | REQUIRED | This feature handles user identity and sends data to an external service. A security review is required before merge. |
| Quality gate: branch up to date, checks green before review | PENDING | Checked at merge time. |

**Result**: No violations. Gates pass. One required follow-up: the security review listed above.

## Spec Gaps Found During Planning

Three user stories in `spec.md` describe actions that the current app does not have. These are recorded here so `/speckit-clarify` or the spec owner can decide. The plan does not silently change the spec.

1. **"Session started" and "session completed" (US2 scenario 2)**: the app plans a session and displays it, but has no start or finish control. The closest existing action is a plan request. **Plan decision**: record "session plan requested" instead, and treat start and finish as out of scope until the app has those controls.
2. **"Mood check-in saved" (US2 scenario 3)**: moods are a static list (`src/features/moods/moods.ts`) and nothing is persisted. **Plan decision**: record "mood selected" with no mood value. This keeps FR-005 and matches the one action the app performs.
3. **"Asking for a suggestion" (US2 list)**: exists ("another idea" in `home-experience.tsx`). Covered as planned.

## Project Structure

### Documentation (this feature)

```text
specs/007-umami-analytics/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output: analytics config, identity, event entities
├── quickstart.md        # Phase 1 output: how to run and verify end to end
├── contracts/
│   ├── event-catalog.md  # Phase 1 output: event names, allowed fields, limits
│   └── tracker-config.md # Phase 1 output: script attributes and environment variables
├── checklists/
│   └── requirements.md
└── tasks.md             # Created by /speckit-tasks, not by this command
```

### Source Code (repository root)

```text
src/
├── features/analytics/
│   ├── analytics-env.ts      # Optional, all-or-nothing parse of the Umami environment
│   ├── identity.ts           # Keyed hash of the Auth0 subject into an opaque distinct ID
│   ├── event-catalog.ts      # Event names and allowed data per event; rejects personal fields
│   └── track.ts              # Client-side guarded wrapper around window.umami
├── components/analytics/
│   ├── umami-script.tsx      # Server component: renders next/script with config attributes
│   └── umami-identify.tsx    # Client component: calls identify once for a signed-in user
├── app/layout.tsx            # Renders UmamiScript (anonymous page views for every page)
├── app/(app)/layout.tsx      # Renders UmamiIdentify with the hashed ID (signed-in area)
└── components/               # Event call sites, one line each:
    ├── exercise-demo-button.tsx  # "exercise demo watched"
    ├── session-planner.tsx       # "session plan requested"
    ├── mood-stack.tsx            # "mood selected"
    └── home-experience.tsx       # "suggestion requested"

tests/
├── unit/analytics/
│   ├── analytics-env.test.ts
│   ├── identity.test.ts
│   ├── event-catalog.test.ts
│   └── track.test.ts
└── e2e/
    └── analytics.spec.ts     # Stub tracker; page view and one event on existing flows
```

**Structure Decision**: One feature folder (`src/features/analytics`) for logic, one component folder for the two React pieces, and minimal one-line call sites in existing components. This keeps the change reviewable in one sitting (constitution III) and keeps the existing features unchanged apart from their call sites.

## Complexity Tracking

No constitution violations to justify. The only deliberate addition beyond the minimum is the keyed hash in `identity.ts`. It is required by FR-006 and FR-005, because `users.id` is the Auth0 subject and must not be sent raw.
