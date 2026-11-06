# Quickstart: Verify Umami Web Analytics

**Feature**: 007-umami-analytics | **Date**: 2026-11-05

This is a run-and-verify guide. It does not contain implementation code. For the design, see [plan.md](./plan.md); for the event list, see [contracts/event-catalog.md](./contracts/event-catalog.md); for script attributes and variables, see [contracts/tracker-config.md](./contracts/tracker-config.md).

## Prerequisites

- Node.js 20.19 or newer (22 LTS recommended) and npm, for the app.
- Docker and Docker Compose, on the server that hosts Umami.
- A PostgreSQL database for Umami (12.14 or newer). Separate from the app's Neon database.
- A subdomain for Umami (for example `analytics.<domain>`) pointing to that server, with HTTPS.
- Access to the app's Vercel project variables, or a local `.env.local`.

## 1. Run Umami (self-hosted)

1. Start Umami with its official Docker image, pointing `DATABASE_URL` at the Umami database. The image needs a random `APP_SECRET` (generate with `openssl rand -hex 32`).
2. Open the Umami admin page, sign in, and **change the default admin password immediately** (the default account is `admin`).
3. Add a website for the Paltrain production hostname. Copy its website ID.
4. Record the Umami version you deployed here: `__________`.

## 2. Configure the app

Add these to `.env.local` for local work, or to the Vercel project for production. Do not commit real values (`.env.example` lists the names only).

```text
UMAMI_SCRIPT_URL=https://analytics.<domain>/script.js
UMAMI_WEBSITE_ID=<website id from step 1>
ANALYTICS_HASH_SECRET=<at least 32 random characters>
```

Leave all three unset to run the app with analytics off. Set only some of them and startup must fail, naming the missing variables. That failure is the intended behavior.

## 3. Run the test suites

```text
npm test                # unit tests, including tests/unit/analytics
npx playwright test     # end-to-end, including tests/e2e/analytics.spec.ts
npm run typecheck
npm run lint
```

The end-to-end analytics test uses a stub tracker, so it does not contact the real Umami server.

## 4. Manual end-to-end check

Use a staging or preview deployment with analytics configured, and a test account.

| Step | Action | Expected result |
|------|--------|-----------------|
| 1 | Open the sign-in page in a fresh browser. | One page view appears in Umami within 1 minute (SC-001). |
| 2 | Sign in, then open the library and an exercise with a demo. | Page views for each page. |
| 3 | Tap "Watch demo". | One `exercise demo watched` event with the `exerciseId` (SC-002). |
| 4 | Request a session plan. | One `session plan requested` event. |
| 5 | Tap "another idea" on a suggestion. | One `suggestion requested` event. |
| 6 | Select a mood. | One `mood selected` event with no mood value. |
| 7 | Inspect one event's data in Umami. | No email, no name, no mood value, no note (SC-003). |
| 8 | Sign in on a second browser and do one action. | Both browsers appear under one linked identity (US3). |
| 9 | Sign out in one browser, then perform an action. | The new action is not linked to the identity (US3 scenario 3; see research SPIKE 2). |
| 10 | Enable Do Not Track in the browser and repeat steps 1 to 6. | No page views or events from that browser (SC-006). |
| 11 | Stop the Umami server and use the app. | No visible error; core flows still work (SC-005). |

## 5. Verify the first-paint requirement

Compare the time to first useful display on a mid-range mobile profile with the tracker configured and unset. The difference must be within measurement noise (SC-004). Use the browser devtools Performance panel or the Chrome DevTools MCP tools already available in this environment.

## 6. Security review before merge

Analytics touches user identity and sends data to an external service, so the constitution requires a dedicated security review. Check at minimum:

- The identity value sent to Umami is the keyed hash, never the raw `users.id`, email, or name.
- `ANALYTICS_HASH_SECRET` appears only in server code and environment, never in the client bundle or the repository.
- The catalog rejects unknown fields, so a new field cannot leak personal data by accident.

Record the review result in the pull request description.
