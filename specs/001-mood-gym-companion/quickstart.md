# Quickstart: Mood-Based Gym Companion

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Contract**: [contracts/api.md](./contracts/api.md)

This guide proves the feature works end to end. It is a run and validation guide. Implementation
details live in the source tree and in `tasks.md`.

## Prerequisites

- Node.js 24 LTS and npm.
- The Vercel CLI, logged in, with this project linked (`vercel link`).
- The marketplace integrations provisioned: Neon Postgres and Auth0 (see [research.md](./research.md) §2–3).
- Local environment variables pulled from Vercel with `vercel env pull --yes`. Never commit the
  resulting file.
- A test Auth0 user with email and password (created in the Auth0 dashboard for the dev tenant).

## Setup

1. Install dependencies with `npm install`.
2. Apply database migrations for `users` and `suggestion_state` with the project's migration command.
3. Validate the template content with the project's content check. It fails if any template is
   malformed, any focus area has fewer than 8 templates, or the total is below 100 (FR-005, SC-003).
4. Start the dev server with `npm run dev`.

## Scenario 1: Sign-in is required (User Story 1, FR-012, FR-016)

1. Open `http://localhost:3000` in a fresh browser session.
2. Expect the buddy sign-in screen. No workout content appears.
3. Call `GET /api/me` without a session. Expect `401 UNAUTHENTICATED` in the envelope.
4. Sign in with the test user. Expect the greeting with the display name (FR-018).

## Scenario 2: Mood-based suggestion (User Story 1, FR-004, FR-007)

1. From the signed-in home page, select the mood "Energized".
2. Expect one to three suggestions. Each shows a name, focus area, duration, intensity, and
   equipment.
3. Expect at least one suggestion with `intensity: high`.
4. Expect the page to say that these are ideas, not a required plan (FR-003).

## Scenario 3: Mood with a low-intensity result (User Story 1, acceptance 2)

1. Select the mood "Tired".
2. Expect every suggestion to have `intensity` of `low` or `moderate`.

## Scenario 4: Focus area directly (User Story 2)

1. Clear the mood and select the focus area "Back".
2. Expect only back templates, each tagged with the moods it fits.
3. Select the mood "Focused" as well. Expect only templates that match both, or a result with
   `partial: true` and a visible note that the match is partial (acceptance 3).

## Scenario 5: No immediate repeat (User Story 3, FR-008)

1. With a mood selected, request suggestions, then tap "Another idea" several times.
2. Expect that no suggestion repeats the one shown immediately before, unless only one template
   matches.

## Scenario 6: Library browse with filters (User Story 3, FR-009)

1. Open the library for "Cardio".
2. Expect a list with name, duration, and intensity for each template.
3. Filter by intensity "low" and by `maxMinutes` 20. Expect only matching templates.

## Scenario 7: Safety notice and cautions (FR-010, FR-011)

1. On any suggestion page, confirm the not-medical-advice notice is visible.
2. Find a `high` intensity template with a caution (for example, a high-impact cardio template).
   Confirm the caution is shown next to the suggestion.

## Scenario 8: Phone layout and failure handling (FR-013, FR-014, SC-006)

1. Open the page at a 320 px width. Confirm no horizontal scrolling and that all controls are
   reachable.
2. Simulate a library outage (for example, by stopping the content loader in a test build). Expect
   an error message that explains the problem, with mood and focus controls still visible.

## Automated checks

| Check | Command | Passes when |
|-------|---------|-------------|
| Unit tests | `npm test` | All pass; selection, filter, and envelope logic covered |
| Integration tests | `npm run test:integration` | Route handlers pass against the test database |
| End-to-end | `npm run test:e2e` | Scenarios 1 to 6 pass in Playwright |
| Coverage | `npm run test:coverage` | 80% or higher (constitution II) |
| Content | `npm run validate:content` | 100+ templates, 8+ per focus area, no schema errors |
| Types and lint | `npm run typecheck && npm run lint` | No errors |

## Done when

- Every scenario above passes.
- Every automated check passes.
- The security review required for auth changes (constitution Quality Gates) is complete.
