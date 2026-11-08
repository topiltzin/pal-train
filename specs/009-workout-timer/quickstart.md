# Quickstart: Verify the Workout Timer

**Feature**: 009-workout-timer | **Date**: 2026-11-08

A run-and-verify guide. For the design, see [plan.md](./plan.md). For states and copy, see [contracts/timer-ui.md](./contracts/timer-ui.md).

## Prerequisites

- The app's setup from `.env.example`. No new environment variables are needed.
- Playwright browsers installed (`npx playwright install chromium`).

## 1. Run the unit tests

```text
npx vitest run tests/unit/timer
```

The reducer and formatter tests cover every transition in `data-model.md`, including ignored events and repeated taps.

## 2. Run the end-to-end test

```text
npx playwright test tests/e2e/workout-timer.spec.ts
```

The test uses the browser clock to move time forward, so the 10-minute timer ends in a fraction of a second of real time.

## 3. Manual check

| Step | Action | Expected result |
|------|--------|-----------------|
| 1 | Plan a 10-minute session | The timer appears under "10 minutes" with "Start timer" and reads `10:00`. |
| 2 | Tap Start timer | The countdown runs; the screen reader hears "Timer started". |
| 3 | Tap Stop after a few seconds | The countdown holds its time; "Timer stopped" is announced. |
| 4 | Tap Start timer, then Reset while stopped | It returns to `10:00` without starting. |
| 5 | Start again and tap Finish | The celebration shows "Well Done, we made it today!!"; "Session complete" is announced; no chime. |
| 6 | Start, switch to another tab, and return after the time has passed | The timer shows the finished state; the chime plays on return. |
| 7 | Turn on reduced motion in the OS, then Finish | The words appear with no moving shapes. |
| 8 | Make a new plan while the timer runs | The timer resets to the new plan's length. |
| 9 | View at 320px wide | All controls fit on screen and labels stay on one line. |

## 4. Before merge

- Typecheck, lint, and build pass.
- Coverage of `src/features/timer/` is at least 80%.
- The celebration text is checked character by character against the contract.
