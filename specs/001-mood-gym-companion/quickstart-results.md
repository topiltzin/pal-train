# Quickstart Results: Mood-Based Gym Companion

**Run date**: 2026-11-01 | **Guide**: [quickstart.md](./quickstart.md) | **Task**: T078

**Legend**: PASS = ran and passed in this pass. NOT RUN = needs a signed-in test user
(`E2E_USER_EMAIL` and `E2E_USER_PASSWORD`), or a manual check. "Spec written" = the e2e spec exists
and skips without credentials.

## Automated checks

| Check | Command | Result |
|-------|---------|--------|
| Unit tests | `npx vitest run tests/unit` | PASS (17 files and 77 tests across unit and integration) |
| Integration tests | `npx vitest run tests/integration` | PASS, against the dev Neon database |
| End-to-end, signed out | `npx playwright test` | PASS: 6 tests. 16 skipped, all signed-in specs |
| Coverage | `npm run test:coverage` | PASS: statements 84%, branches 83%, functions 82%, lines 83% |
| Content | `npm run validate:content` | PASS: 104 templates across 8 focus areas |
| Types and lint | `npm run typecheck && npm run lint` | PASS |

## Scenarios

| # | Scenario | Result | Evidence |
|---|----------|--------|----------|
| 1.1 | Fresh visit shows the buddy sign-in screen | PASS | `tests/e2e/sign-in-gate.spec.ts` |
| 1.2 | No workout content before sign-in | PASS | `tests/e2e/sign-in-gate.spec.ts` |
| 1.3 | Signed-out `GET /api/me` returns 401 envelope | PASS | `tests/e2e/sign-in-gate.spec.ts`, `tests/integration/api/me.test.ts` |
| 1.4 | Sign in shows the greeting with the display name | NOT RUN | Needs a test user. The greeting renders in `(app)/layout.tsx`. |
| 2 | Energized gives one to three ideas, high intensity present, idea framing | NOT RUN | Spec written: `tests/e2e/mood-suggestion.spec.ts`. Selection rules PASS in unit tests. |
| 3 | Tired gives only low or moderate intensity | NOT RUN | Spec written: `tests/e2e/mood-suggestion.spec.ts`. The intensity rule is covered by the selection unit tests. |
| 4 | Focus alone, and focus with mood, including partial note | NOT RUN in browser | Spec written: `tests/e2e/focus-direct.spec.ts`. Focus-only, combined, and partial responses PASS in `tests/integration/api/suggestions-focus.test.ts`. |
| 5 | "Another idea" does not repeat immediately | NOT RUN in browser | Integration PASS in `tests/integration/api/suggestions-next.test.ts`. The button is wired in `home-experience.tsx`. |
| 6 | Library browse with intensity and minutes filters | NOT RUN in browser | Filter and paging PASS in `tests/integration/api/templates.test.ts`. Page is `src/app/(app)/library/[focus]/page.tsx`. |
| 7 | Not-medical-advice notice and high-intensity caution visible | PARTIAL | Notice is in `medical-notice.tsx` and `tests/e2e/mood-suggestion.spec.ts`. Caution display is not checked in a browser. |
| 8.1 | 320 px: no horizontal scroll, controls reachable | PARTIAL PASS | Sign-in screen PASS in `tests/e2e/phone-layout.spec.ts`. Home and library at 320 px are NOT RUN. |
| 8.2 | Library outage keeps mood and focus controls visible | NOT RUN | Spec written: `tests/e2e/library-outage.spec.ts`. Error mapping PASS in `tests/unit/api/route-error.test.ts`. |

## Result

- Scenarios 1.1 to 1.3 and the sign-in part of 8.1 pass. Everything else needs a test user to confirm in a browser.
- No failures were found in the runs that were possible.
- **To finish T078:** set `E2E_USER_EMAIL` and `E2E_USER_PASSWORD`, run `npx playwright test`, then update this file.
