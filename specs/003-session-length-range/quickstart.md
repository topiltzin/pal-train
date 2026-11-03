# Quickstart: Session Length Range

Validation guide for the feature. Implementation steps are in tasks.md.

## Prerequisites

- Node.js and the project dependencies installed (`npm install`).
- A local `.env.local` with the Auth0 and database settings the app already uses.
- A signed-in test user (the e2e helper in `tests/e2e/helpers/sign-in.ts` signs one in).

## 1. Automated checks

```bash
npm run validate:content     # exercise files parse; reports exercise counts per focus area
npm run typecheck
npm run lint
npm test                     # unit + integration
npm run test:coverage        # expect at least 80% on new files under src/features/sessions
npm run build
npm run test:e2e             # includes session-length.spec.ts
```

Expected: all pass. `validate:content` prints the number of exercises for each focus area. Any focus area with fewer than 10 exercises should be called out in the review.

## 2. Manual walkthrough

1. Run `npm run dev` and open the home screen while signed in.
2. Find the session length bar. Expect two handles, a default range of 30 to 60 minutes, and the text "30 to 60 minutes".
3. Drag the maximum handle to 45. Expect the text to update at once and no request during the drag.
4. Release the handle. Expect a session plan with a total of at most 45 minutes and at least 3 exercises.
5. Drag the minimum handle past the maximum. Expect the maximum to move with it.
6. Set the range to 10 to 10 (both handles together). Expect 3 exercises or a shortfall message.
7. Set the range to 10 to 90 with a mood. Expect up to 10 exercises, total at most 90 minutes.
8. Use the keyboard: focus each handle, press arrow keys. Expect 5-minute steps and a screen-reader name for each handle.
9. Check at 375 px width: the bar and the plan fit without horizontal scrolling.

## 3. Failure checks

- Send a bad body to `POST /api/session-plan` (for example `minMinutes: 35`). Expect `INVALID_INPUT`.
- Sign out and call the endpoint. Expect the auth error, not a plan.
