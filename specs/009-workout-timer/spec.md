# Feature Specification: Workout Timer with Finish Celebration

**Feature Branch**: `009-workout-timer` (not created; this repo commits directly to `main`)

**Created**: 2026-11-08

**Status**: Draft

**Input**: User description: "add a Start-timer that will start a small timer and do as sound once it rech the time, or the button is finish, and make a cool efect that says.. Well Done we made it today!!"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Time a workout and hear when it ends (Priority: P1)

A user has a session plan on screen. They tap Start timer. A small countdown appears, set to the session's length. When the time runs out, a sound plays and the timer shows that the session is done.

**Why this priority**: This is the core request. A timer that counts down and sounds at the end is the smallest useful version.

**Independent Test**: Plan a 10-minute session, tap Start timer, and confirm the countdown runs and a sound plays when it reaches zero, without any other action.

**Acceptance Scenarios**:

1. **Given** a session plan is on screen, **When** the user taps Start timer, **Then** a countdown appears showing the session's length and starts running.
2. **Given** the countdown is running, **When** it reaches zero, **Then** a sound plays once and the timer shows that the session is complete.
3. **Given** the countdown is running, **When** the user looks at it, **Then** it shows the time remaining in minutes and seconds, and the seconds update every second.
4. **Given** the user switched to another app or browser tab, **When** the countdown reaches zero, **Then** the sound still plays when the user returns, and the timer shows the correct remaining time at all times.
5. **Given** the device is muted, **When** the countdown reaches zero, **Then** the timer still shows that the session is complete, with no sound.

---

### User Story 2 - Finish early with a celebration (Priority: P2)

A user who is done before the timer ends taps Finish. The timer stops, and a celebration appears with the words "Well Done, we made it today!!" The celebration also appears when the timer reaches zero.

**Why this priority**: The finish button and the celebration are the reward moment the user asked for. They depend on the timer from Story 1.

**Independent Test**: Start a timer, tap Finish after a few seconds, and confirm the timer stops and the celebration appears with the exact words.

**Acceptance Scenarios**:

1. **Given** the countdown is running, **When** the user taps Finish, **Then** the countdown stops and the celebration appears.
2. **Given** the celebration is showing, **When** it appears, **Then** it reads "Well Done, we made it today!!" exactly.
3. **Given** the countdown reaches zero, **When** the sound plays, **Then** the same celebration appears.
4. **Given** the celebration is showing, **When** the user dismisses it or taps Start timer again, **Then** it closes and the timer can be started again for a new session.
5. **Given** the user has reduced motion turned on in their device settings, **When** the celebration appears, **Then** it shows the same words without moving or flashing.

---

### User Story 3 - Stop or reset the timer (Priority: P3)

A user who wants to pause or start over can stop the timer and return it to the session's full length.

**Why this priority**: Useful, but the timer already works with Start and Finish alone.

**Independent Test**: Start a timer, tap Stop, confirm the countdown halts, then tap Reset and confirm it returns to the full length.

**Acceptance Scenarios**:

1. **Given** the countdown is running, **When** the user taps Stop, **Then** the countdown halts at the time shown.
2. **Given** the countdown is stopped, **When** the user taps Reset, **Then** it returns to the session's full length without starting.

---

### Edge Cases

- What happens when the user starts a new session plan while a timer is running? The running timer stops and the new plan's length is used.
- What happens when the page is reloaded during a countdown? The countdown restarts from the session's full length; it is not saved.
- What happens when the browser blocks sound until the user interacts with the page? Tapping Start timer counts as the interaction, so the sound is allowed.
- What happens when the sound cannot play at all (no audio support)? The celebration still shows, so the end of the session is never missed.
- What happens when the user taps Finish or Start several times quickly? Each tap has one effect, and the celebration shows once.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The session view MUST show a Start timer control whenever a session plan is on screen.
- **FR-002**: Starting the timer MUST begin a countdown set to the session's total length.
- **FR-003**: The countdown MUST show the time remaining in minutes and seconds, updated every second.
- **FR-004**: When the countdown reaches zero, the app MUST play one sound and show the completion celebration.
- **FR-005**: A Finish control MUST be available while the countdown runs. Tapping it MUST stop the countdown and show the completion celebration.
- **FR-006**: The celebration MUST show the words "Well Done, we made it today!!" exactly as written.
- **FR-007**: The celebration MUST include a visual effect. Under reduced motion the effect MUST be replaced by a still display of the same words.
- **FR-008**: The countdown MUST stay accurate when the page is in the background or the device sleeps: the time shown and the end moment are based on the real clock, not on counting ticks.
- **FR-009**: The timer MUST offer Stop (pause) and Reset (return to the full length) controls.
- **FR-010**: Starting a new session plan MUST stop any running timer.
- **FR-011**: The timer MUST announce to screen readers when it starts, when it finishes, and when the celebration appears.
- **FR-012**: The timer MUST NOT store or send any personal data, and MUST NOT save the countdown between page loads.

### Key Entities

- **Workout Timer**: The countdown for the current session. Attributes: total length, time remaining, state (ready, running, stopped, finished).
- **Completion Celebration**: The message and effect shown on finish. Attributes: message text, shown or hidden.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In a test of 10 timers, each reaches zero within 1 second of its set time, including when the page is in the background.
- **SC-002**: In a test of 20 finishes, the sound plays on every timer that reaches zero, and the celebration appears within 1 second of finishing, whether by Finish or by the timer ending.
- **SC-003**: A user can finish a timer early with one tap, in a usability check with 10 participants.
- **SC-004**: The celebration text matches "Well Done, we made it today!!" exactly in 100% of checks.
- **SC-005**: With reduced motion turned on, the celebration shows no moving or flashing content in 100% of checks.
- **SC-006**: The timer works at phone width (320px) without any control falling outside the screen.

## Assumptions

- The timer appears on the session plan view, the same place a plan is shown today, and uses that plan's total length.
- The sound is a short, pleasant chime that the app provides; the user can mute it with the device's own volume or mute switch.
- The celebration effect is a brief, playful burst of accent-colored shapes behind the message, lasting a few seconds, and it can be closed at any time. Its look follows the app's existing colors and typography. The implementation may refine the exact visuals.
- The timer is for a single session at a time and is not saved between visits.
- No account or sign-in is needed to use the timer, and nothing about it is recorded.
- The app's analytics do not track timer use in this release.
