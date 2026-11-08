# Contract: Workout Timer UI

**Feature**: 009-workout-timer | **Component**: `src/components/workout-timer.tsx`

This is the contract for the timer as a UI. It fixes the controls, their labels, the states, what is announced, and the exact copy. Changing any of these is a change to this contract.

## Props

| Prop | Type | Rule |
|------|------|------|
| `totalMinutes` | integer | The session's total length. From the plan, 10 to 90 in steps of 5. |

The component takes no other input. It reads no stored values.

## Controls

| State | Visible controls | Labels (exact) |
|-------|------------------|----------------|
| `ready` | Start | "Start timer" |
| `running` | Stop, Finish | "Stop", "Finish" |
| `stopped` | Start (resumes), Reset, Finish | "Start timer", "Reset", "Finish" |
| `finished` | Reset | "Start again" |

Every control is at least 44px tall and keeps its label on one line at 320px wide.

## Countdown display

- Shows the remaining time as `m:ss`, updated at least once a second.
- Uses tabular (fixed-width) digits so the display does not shift as it counts.
- Shows the full length in `ready` and the frozen remaining time in `stopped`.

## Announcements (spec FR-011)

A polite live region carries exactly these messages, in English:

| Event | Message |
|-------|---------|
| Start (from `ready`) | "Timer started" |
| Stop | "Timer stopped" |
| Finish or clock reaches zero | "Session complete" |

## Celebration (spec FR-005, FR-006, FR-007)

- Appears on Finish, and when the clock reaches zero.
- Text, exactly: **Well Done, we made it today!!**
- A role of `status`, so the words are read once.
- Visual effect: a short burst of accent-coloured shapes, about 2.5 seconds, then the words stay still.
- Under `prefers-reduced-motion: reduce`: no shapes and no movement. The words still appear.
- Closes when the user taps "Start again" (returns to `ready`) or the timer is reset.

## Sound

- One chime at the moment the timer reaches `finished` by the clock.
- No chime on Finish (the user chose to end it).
- Silent when audio is unavailable. The celebration still shows.

## Copy rules

- No emoji, no decorative symbols, no em-dashes or en-dashes in visible text.
- No scroll or helper labels beyond the controls above.
