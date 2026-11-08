# Data Model: Workout Timer with Finish Celebration

**Feature**: 009-workout-timer | **Date**: 2026-11-08

No data is stored or sent (spec FR-012). The timer is client-side state only.

## Timer state

One value of this union is held per timer.

| Status | Fields | Meaning |
|--------|--------|---------|
| `ready` | `totalMs` | Not started. Shows the full length. |
| `running` | `totalMs`, `endAt` (epoch milliseconds) | Counting down. Remaining time is `endAt - now`. |
| `stopped` | `totalMs`, `remainingMs` | Paused by Stop. Shows the time when it stopped. |
| `finished` | `totalMs` | Ended by the clock reaching zero or by Finish. The celebration shows. |

`totalMs` is the plan's total minutes times 60,000. It never changes for a given timer.

## Events

| Event | Allowed from | Result |
|-------|--------------|--------|
| `start` | `ready`, `stopped` | `running`, with `endAt = now + remaining` |
| `stop` | `running` | `stopped`, with `remainingMs = endAt - now` |
| `reset` | `running`, `stopped`, `finished` | `ready` |
| `finish` (Finish button) | `running`, `stopped` | `finished` |
| `tick` (clock reached zero) | `running` | `finished` when `now >= endAt`, otherwise unchanged |

Any event not listed for a status does nothing and returns the same state (no error, no double effect). This means repeated taps have one effect (spec edge case).

## Derived values

- **Remaining milliseconds**: `running` gives `max(0, endAt - now)`; `stopped` gives `remainingMs`; `ready` gives `totalMs`; `finished` gives `0`.
- **Display text**: remaining milliseconds rounded up to whole seconds, formatted as `m:ss` (for example `9:05`, `0:42`). Rounding up means the display never reads `0:00` before the end.

## Validation rules

- `totalMs` must be a positive whole number of minutes times 60,000. Lengths come from the plan, which already limits them to 10 to 90 minutes in steps of 5.
- `endAt` and `remainingMs` are never negative.
- The sound and celebration fire exactly once per timer, on the transition into `finished`.
