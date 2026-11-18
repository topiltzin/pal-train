# Quickstart: Swap an Exercise for Another of the Same Type

How to check the feature works end to end once it is built. It does not repeat the design; see [data-model.md](data-model.md) and [contracts/exercise-alternatives-api.md](contracts/exercise-alternatives-api.md).

## Prerequisites

- Node.js and the project's dependencies installed (`npm install`).
- A local `.env.local` that lets the app run (see `.env.example`).
- A signed-in test account for browser checks. Set `E2E_USER_EMAIL` and `E2E_USER_PASSWORD`; the signed-in tests skip with a stated reason when these are unset.

## 1. Automated checks

```bash
npm run typecheck
npm run lint
npm test
npm run test:coverage   # changed code must be at least 80% covered
```

Expected: all pass. The new unit and integration tests cover the alternatives rules (same type, not in plan, length check, cycling order, empty list, demo fallback).

## 2. Endpoint check (signed in)

Start the app and call the endpoint with a plan that includes "Barbell curl":

```bash
npm run dev
```

Send `POST /api/exercise-alternatives` with `exerciseId: "biceps-004"` and a plan's ids in `currentExerciseIds`.

Expected:
- Every option has focus `biceps`.
- "Barbell curl" and the other plan ids are absent.
- Options that would break the range show `available: false` with `unavailableReason: "over_length"`.

## 3. Browser walkthrough

1. Open the home page and generate a plan that includes a biceps exercise.
2. On a card, use the swap control. Expected: that card changes to a different biceps exercise; other cards and their order are unchanged; total minutes update.
3. Swap the same card again. Expected: the card moves to the next biceps exercise, never repeating one already in the plan.
4. Open the options list on a card. Expected: options show name, minutes, equipment, and intensity. Choose one. Expected: the card changes, the list closes, and focus returns to the card.
5. Start the workout timer. Expected: swap controls are disabled, with a message saying why. Stop or reset the timer; expected: controls are enabled again.
6. Narrow the browser to a phone width (about 390px). Expected: no horizontal scrolling on the plan, the options list, or a swapped card.
7. Turn on reduced motion in the browser. Expected: a swap replaces the card with no fade.
8. Keyboard only: tab to a swap control and activate it with Enter. Expected: the control's name reads "Swap <exercise name>" in the accessibility tree.

## 4. End-to-end test

```bash
npm run test:e2e -- tests/e2e/exercise-swap.spec.ts
```

Expected: the signed-in flow from step 3 passes. Without `E2E_USER_EMAIL` and `E2E_USER_PASSWORD`, the spec skips with its stated reason.

## Troubleshooting

- A swap control is missing on a card: the card may have no demo lookup result, or the plan was built before the feature. Regenerate the plan.
- Options are empty for a muscle group: every same-type exercise is already in the plan, or none exist. The UI should show "No other exercises for this muscle group."
