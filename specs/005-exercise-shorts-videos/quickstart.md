# Quickstart: Exercise Demo Shorts

**Feature**: 005-exercise-shorts-videos | **Use**: validate the feature end to end after implementation.

## Prerequisites

- `DATABASE_URL` set in `.env.local` to the Neon database.
- A test user signed in through Auth0 (see `tests/e2e/helpers/sign-in.ts`), for the e2e run.
- Dependencies installed (`npm install`).

## 1. Apply the migration

```bash
node --env-file=.env.local node_modules/.bin/drizzle-kit migrate
```

`npm run db:migrate` does not read `.env.local` by itself, so load the file with `--env-file` as above.

Expected: the `exercise_demo_links` table exists with the partial unique index `exercise_demo_links_one_active`.

## 2. Import the reviewed links

```bash
node --env-file=.env.local node_modules/.bin/tsx scripts/import-exercise-demos.ts specs/005-exercise-shorts-videos/demo-links.reviewed.csv
```

Run this only after the decisions in the reviewed file have been approved. The file ships with proposed decisions.

Expected: a summary such as `Imported 6 links, 0 already current, 0 rows with problems.` Running it a second time changes nothing (idempotent), and the active link per exercise stays unique.

## 3. Automated checks

```bash
npm run typecheck
npm run lint
npm test                      # unit tests
npm run test:integration      # repository and session-plan tests against Neon
npm run test:coverage         # must report at least 80% for new and changed code
npm run test:e2e              # signed-in flows; skipped without E2E credentials
```

## 4. Manual check in the browser

1. Sign in and open the home screen.
2. Pick the mood "Energized" and the muscle group "Back".
3. Tap a plan row that has a demo (for example "Lat pulldown" once linked). Confirm the "Watch demo" button is shown.
4. Tap "Watch demo". Confirm: the window opens on the same page, the address bar still shows the app, and the video starts.
5. Press Escape. Confirm: the window closes, the page is in the same place, and focus is on the "Watch demo" button.
6. Repeat with the browser Back action. Confirm the same outcome.
7. Open a row without a demo. Confirm there is no "Watch demo" button.

## 5. Failure check

Temporarily break the video id in the database (for example an id of a private Short). Open its demo. Confirm: the window shows "This demo could not load." and an "Open on YouTube" link, with no blank frame.

## 6. Security review (required by the constitution)

Before merge, confirm:
- Every query uses Drizzle parameters; no string-built SQL.
- The embed host is fixed to `youtube-nocookie.com`; only validated 11-character ids reach the URL.
- The API only returns `videoId` and `title`, not internal ids or the channel column.
- The import script reads only the reviewed CSV and does not accept URLs.
- The demo lookup runs only for signed-in requests (the plan handler already requires a session).
