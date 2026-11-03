# Feature Specification: Session Length Range

**Feature Branch**: `003-session-length-range` (not created; this repo commits directly to `main`)

**Created**: 2026-11-03

**Status**: Draft

**Input**: User description: "add some time length min to max and used a bar that moves ... it depends how many exercises to add based on this min-max, at least for min will be 3 exercises and max ... fitness-coach design will be 1 1/2 hours"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Choose a session length range with a bar (Priority: P1)

A signed-in user wants a workout that fits the time they have. They see a bar with two handles, one for the shortest acceptable session and one for the longest, and drag them to set a minimum and maximum length in minutes. The session they get fits inside that range.

**Why this priority**: Time available is the most common constraint on a workout. This is the smallest slice that delivers the requested control and the time-based session.

**Independent Test**: Open the home screen, set the range to 30 to 45 minutes, select a mood, and confirm the planned session's total time falls between 30 and 45 minutes.

**Acceptance Scenarios**:

1. **Given** the home screen is open, **When** the user looks at the session length control, **Then** a bar with a minimum handle and a maximum handle is shown, labelled in minutes, with a default range of 30 to 60 minutes.
2. **Given** the range is 30 to 60 minutes, **When** the user drags the maximum handle to 45 minutes, **Then** the displayed range updates to 30 to 45 minutes without a page reload.
3. **Given** the range is 30 to 60 minutes, **When** the user drags the minimum handle above the maximum, **Then** the maximum moves with it so the minimum never exceeds the maximum.
4. **Given** a range is set and a mood or muscle group is chosen, **When** the session loads, **Then** its total planned time is at most the longest length, and it has at least 3 exercises.

---

### User Story 2 - More exercises for longer sessions (Priority: P2)

A user who picks a longer range gets a session with more exercises. A short session still has enough exercises to be a real workout.

**Why this priority**: The number of exercises is the visible result of the time range and is what makes the range useful, but it depends on User Story 1's control.

**Independent Test**: Set the range to the shortest allowed value and confirm the session has at least 3 exercises. Set the range to 90 minutes and confirm the session has the maximum number of exercises.

**Acceptance Scenarios**:

1. **Given** the range's maximum is at the shortest allowed length, **When** a session is planned, **Then** it contains at least 3 exercises.
2. **Given** the range's maximum is 90 minutes, **When** a session is planned, **Then** it contains the maximum number of exercises defined for the longest session.
3. **Given** two ranges with the same mood and muscle group, **When** the longer range is planned, **Then** it has at least as many exercises as the shorter range.

---

### User Story 3 - See what the session contains (Priority: P3)

A user can see each exercise in the session with its duration, so they know how the time is spent.

**Why this priority**: It supports trust in the plan. The plan works without it, so it ranks below the range and the exercise count.

**Independent Test**: Plan a session and confirm each exercise shows its name and duration, and that the durations add up to the total shown.

**Acceptance Scenarios**:

1. **Given** a session is planned, **When** the user reads it, **Then** each exercise shows its name and its planned minutes.
2. **Given** a session is planned, **When** the user adds the exercise minutes, **Then** the sum matches the session total.

---

### Edge Cases

- What happens when the minimum and maximum handles are set to the same value? The range is treated as a single length, and the session is planned for that length.
- What happens when the library has fewer exercises than the range asks for? The session shows every available exercise that fits and states that the session is shorter than the target. It never pads with repeats.
- What happens when no exercise fits the range at all? A clear message asks the user to widen the range, and no session is shown.
- What happens when the user changes the range after a session is shown? The session is replanned for the new range and the previous session is cleared.
- What happens when the user only uses the range and picks no mood or muscle group? The range still applies to the session planned from the library as a whole, using the same exercise count rules.
- What happens with a high-intensity exercise? It keeps its caution text, and it counts toward the session like any other exercise.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The home screen MUST show a session length control with a minimum handle and a maximum handle on one bar.
- **FR-002**: Both handles MUST move in whole steps of 5 minutes, between 10 and 90 minutes inclusive.
- **FR-003**: The default range MUST be 30 to 60 minutes.
- **FR-004**: The minimum MUST never be set above the maximum. Moving one handle past the other MUST move the other handle with it.
- **FR-005**: The current minimum and maximum MUST be shown as text in minutes, and the text MUST update as the handles move.
- **FR-006**: The session length control MUST be operable by touch, mouse, and keyboard, and each handle MUST be announced with its name and value to screen readers.
- **FR-007**: The number of exercises in a session MUST scale with the range. The shortest allowed session (10 minutes) MUST include at least 3 exercises.
- **FR-008**: At the longest allowed session (90 minutes), the session MUST include 10 exercises. Sessions between these lengths MUST include a count that does not decrease as the length increases.
- **FR-009**: A planned session's total time MUST NOT exceed the longest length, and it MUST contain at least 3 exercises. The shortest length is a best-effort target. If the library cannot meet the range, the session MUST say so (see Edge Cases) and MUST NOT exceed the maximum.
- **FR-010**: Each exercise in a session MUST show its name, its planned minutes, and its equipment.
- **FR-011**: Changing the range or the mood or muscle group MUST replan the session and replace the previous one.
- **FR-012**: The session MUST NOT repeat the same exercise twice within one session.
- **FR-013**: Any exercise with a high-intensity level MUST keep its caution text wherever it appears in a session.
- **FR-014**: The existing mood dial and muscle group picker MUST continue to work and MUST be combinable with the session length range.

### Key Entities

- **Session Length Range**: The minimum and maximum session length in minutes, in whole 5-minute steps, from 10 to 90. Its minimum is never greater than its maximum.
- **Exercise**: One movement in the library, with a name, muscle group (focus), intensity, equipment, planned minutes, and an optional caution. Each exercise belongs to at least one mood.
- **Session Plan**: An ordered list of exercises chosen for a range, with a total time, a count, and a flag when the library could not fully meet the range.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of planned sessions fall within the selected range, or show the shortfall message described in the Edge Cases.
- **SC-002**: 100% of planned sessions at the shortest allowed length contain at least 3 exercises.
- **SC-003**: A user can set a 30 to 45 minute range in under 10 seconds on a phone.
- **SC-004**: In usability checks, at least 9 out of 10 users can state how many exercises a session has and roughly how long it takes, without reading the exercise list.
- **SC-005**: The control passes an accessibility check for keyboard use, screen reader labels, and contrast against its background.

## Assumptions

- **Length steps**: The range moves in 5-minute steps from 10 to 90 minutes. The 90-minute upper bound follows the existing duration limit in the library and the requested 1 1/2 hour design target.
- **Exercise count**: Sessions are built from exercises. The count rises from 3 at the shortest session to 10 at 90 minutes, in steps that never go down as length goes up. The exact count per length is a design decision for planning.
- **Exercise data**: The current library stores whole routines with a single duration, not per-exercise entries. Building sessions requires an exercise-level source (each with a name, minutes, equipment, intensity, and moods). Creating or migrating that data is a dependency of this feature.
- **Default range**: 30 to 60 minutes is the starting point for new visitors. The range is not saved between visits in this version.
- **Scope**: Only the home screen session planner changes. The library browse pages and the sign-in flow are out of scope.
- **Design direction**: The length control follows the project's existing visual language (dark ink, pill controls, muted accents) and the touch and readability rules already used on the home screen. It is a single shared bar, not two separate inputs.
- **Medical content**: The existing medical notice stays on the home screen and applies to every session.
