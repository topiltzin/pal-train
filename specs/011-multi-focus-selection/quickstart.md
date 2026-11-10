# Quickstart: validate multi-group planning

**Feature**: 011-multi-focus-selection | **Contract**: [contracts/plan-interfaces.md](contracts/plan-interfaces.md) | **Data model**: [data-model.md](data-model.md)

## Prerequisites

- The local environment from feature 010 works: `.env.local` has `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, and `DATABASE_URL`.
- A test account exists and can sign in.
- Run `npm run dev` and open `http://localhost:3000`.

## 1. Single group is unchanged (spec FR-007, SC-004)

```bash
curl -s -X POST http://localhost:3000/api/session-plan -H 'content-type: application/json' -H 'cookie: <signed-in session>' -d '{"minMinutes":0,"maxMinutes":30,"focus":"biceps"}'
```

Expected: exercises all have `focus` = `biceps`, and `groupNotices` is `[]`.

## 2. Two groups cover both (spec US1, SC-002)

```bash
curl -s -X POST http://localhost:3000/api/session-plan -H 'content-type: application/json' -H 'cookie: <signed-in session>' -d '{"minMinutes":0,"maxMinutes":30,"focus":["biceps","triceps"]}'
```

Expected: the exercises include at least one `biceps` and one `triceps`. `totalMinutes` is within 5 minutes of 30 unless `groupNotices` explains it.

## 3. Limit of three and duplicates (spec FR-002, FR-003)

- Four ids (`["chest","back","legs","core"]`) return `400` with the limit message.
- `["biceps","biceps"]` behaves like `["biceps"]`.

## 4. Unknown group (spec FR-009)

`{"focus":["elbows"]}` returns `400` and lists the valid ids.

## 5. Notices (spec US3, SC-006)

`{"minMinutes":0,"maxMinutes":10,"focus":["biceps","triceps","chest"]}` should return a `groupNotices` entry for any group that could not get its share.

## 6. Connector parity (spec FR-010, SC-005)

With the connected ChatGPT connector, ask for "a 30 minute workout for biceps and triceps". Compare the exercises with step 2 for the same mood and length. They should match.

## 7. Automated checks

```bash
npm run typecheck
npm run lint
npx vitest run tests/unit tests/integration
```

Expected: all pass, with new tests for the single-group identity, the limit, the duplicate rule, the count split, and the notices.
