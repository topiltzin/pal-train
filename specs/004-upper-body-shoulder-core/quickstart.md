# Quickstart: Upper Body, Shoulder, and Core Options

Validation guide for the feature. Implementation steps are in tasks.md.

## Prerequisites

- Dependencies installed (`npm install`).
- A signed-in test user for the e2e checks (see `tests/e2e/helpers/sign-in.ts`).

## 1. Content and types

```bash
npm run typecheck
npm run validate:content     # expect 13 focus areas, each with routines and exercises at the minimums
npm run lint
npm test                     # unit + integration, including the 13-entry focus list
```

Expected: all pass. `validate:content` prints counts per focus area, and each of the three new areas has at least 8 routines and at least 10 exercises.

## 2. Level check

1. Open `specs/004-upper-body-shoulder-core/level-check.md`.
2. Confirm one row exists for every routine in `content/templates/*.json` and every exercise in `content/exercises/*.json`. Count the rows against the file contents.
3. For each row with `changed` true, open the file, confirm the new level matches the rubric in research.md, and confirm the reason is accurate.
4. Confirm every `high` entry has a caution.

## 3. Manual walkthrough

1. Run `npm run dev` and sign in.
2. Open the muscle group menu. Expect "Upper body", "Shoulders", and "Core" after "Stretching".
3. Tap "Shoulders" with no mood. Expect only shoulder routines.
4. Open the shoulders library. Filter to moderate intensity and 30 minutes or less. Expect every result to match both filters.
5. Open a high-intensity routine. Expect its level and its caution on the same screen.
6. At 320 px width, check the muscle group menu has no horizontal scroll.

## 4. Automated e2e

```bash
npm run test:e2e
```

Expected: `phone-layout.spec.ts` passes at 320 px with 13 options. Signed-in tests run only with `E2E_USER_EMAIL` and `E2E_USER_PASSWORD` set.
