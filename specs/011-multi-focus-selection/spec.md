# Feature Specification: Plan a Workout for More Than One Muscle Group

**Feature Branch**: `011-multi-focus-selection` (not created; this repo commits directly to `main`)

**Created**: 2026-11-10

**Status**: Draft

**Input**: User description: "Let the user add more than 1 group bicep tricep etc."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Pick several muscle groups in the app (Priority: P1)

A Pal Buddy user chooses two or three muscle groups, such as biceps and triceps, and asks for a workout. The plan includes exercises for every chosen group, and the time is shared between them. The user can still choose just one group, as today.

**Why this priority**: This is the request itself. Today a user who wants arms and shoulders has to plan two separate sessions.

**Independent Test**: Choose biceps and triceps with a mood and a 30-minute length. Confirm the plan contains exercises for both groups, that their minutes add up to about 30, and that the mood still applies.

**Acceptance Scenarios**:

1. **Given** a user picks biceps and triceps and a 30-minute length, **When** the plan is made, **Then** it contains exercises for both groups, and the minutes add up to about 30.
2. **Given** a user picks one group, **When** the plan is made, **Then** the result is the same plan Pal Buddy makes today for that group.
3. **Given** a user picks a fourth group, **When** they try to add it, **Then** Pal Buddy says the limit is three and keeps the first three.
4. **Given** a user picks the same group twice, **When** the plan is made, **Then** the group is counted once.

---

### User Story 2 - Ask for several muscle groups from ChatGPT (Priority: P2)

A connected user asks ChatGPT for a workout that covers more than one group, for example "a workout for biceps and triceps, 30 minutes". The connector returns a plan that covers each group, as the app does.

**Why this priority**: The connector already plans single-group workouts. Matching the app keeps the two in step, but the app comes first.

**Independent Test**: With a connected account, ask ChatGPT for a plan with two groups. Confirm the returned exercises match the app's plan for the same groups, mood, and length.

**Acceptance Scenarios**:

1. **Given** a connected user asks for two groups and a length, **When** the request is made, **Then** the plan covers both groups with the same exercises the app would show.
2. **Given** a user names a group that does not exist, **When** the request is made, **Then** Pal Buddy lists the valid groups and does not guess.
3. **Given** a user asks for four groups, **When** the request is made, **Then** Pal Buddy explains the limit of three.

---

### User Story 3 - See when a group cannot fit the time (Priority: P3)

When the chosen length is too short to give every group at least one exercise, or a group has too few exercises to fill its share, the plan says so. The user sees which group was shortened or left out and why.

**Why this priority**: Without this notice, a user could think a group was forgotten by mistake. It is needed for trust, but the plan works without it.

**Independent Test**: Choose three groups and a 10-minute length. Confirm the plan states that one or more groups could not be fully covered.

**Acceptance Scenarios**:

1. **Given** three groups and a 10-minute length, **When** the plan is made, **Then** the plan notes which group could not be fully covered.
2. **Given** a group with fewer exercises than its share of time, **When** the plan is made, **Then** the plan notes that the group was shortened.

---

### Edge Cases

- What happens when a group has no exercises in the library? The plan skips it and states that no exercises were available for that group.
- What happens when the mood excludes most exercises for a group? The plan uses the closest matches for that group, as it does today for a single group, and notes it.
- What happens when a user changes the selection after a plan is shown? The old plan is replaced by a new one. Nothing is saved.
- What happens when the library is unavailable? The app and the connector show a clear "temporarily unavailable" message, not an empty plan.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Users MUST be able to select one, two, or three muscle groups for a single workout.
- **FR-002**: Selecting a fourth group MUST be refused with a message that the limit is three. The first three choices are kept.
- **FR-003**: Selecting the same group more than once MUST count it once.
- **FR-004**: When a plan covers more than one group, the requested length MUST be shared evenly between the groups, rounded to the 5-minute steps the app already uses.
- **FR-005**: Each selected group MUST receive at least one exercise when the length allows it.
- **FR-006**: The mood selection MUST apply to every group in the plan, using the same matching rules as a single-group plan.
- **FR-007**: A plan for exactly one group MUST be identical to the plan Pal Buddy makes today for that group, for the same mood and length.
- **FR-008**: When a group cannot be fully covered, the plan MUST say which group, and why (not enough time, or not enough exercises).
- **FR-009**: An unknown group name MUST be refused with the list of valid groups, the same as today.
- **FR-010**: The connector MUST accept the same group selection as the app, and return the same plan for the same inputs.
- **FR-011**: The safety notice and the gentle-mood length limit MUST apply to multi-group plans exactly as they do to single-group plans.
- **FR-012**: Nothing about the selection or the plan MUST be stored. Selections are for the one plan being made.

### Key Entities *(include if feature involves data)*

- **Muscle Group Selection**: The groups a user picked for one workout. Attributes: an ordered list of up to three groups, with duplicates removed.
- **Workout Plan**: The result for one request. Attributes: the groups covered, the exercises, the minutes for each group, and any notices about groups that could not be fully covered.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can choose two groups and get a plan in under 30 seconds, in a usability check with 10 participants, and at least 9 of 10 finish on the first attempt.
- **SC-002**: For a multi-group request with a length of at least 20 minutes, at least 95% of plans include an exercise for every selected group, in a test of 100 requests.
- **SC-003**: The minutes in a multi-group plan are within 5 minutes of the requested length in 100% of 100 requests, unless a notice explains the difference.
- **SC-004**: The single-group plan matches today's plan in 100% of 30 comparison cases.
- **SC-005**: The app and the connector return the same exercises for the same selection, mood, and length in 100% of 30 comparison cases.
- **SC-006**: Every plan that does not fully cover a group carries a notice naming that group, in 100% of such cases in the test set.

## Assumptions

- The muscle groups are the existing focus areas in the library (for example chest, back, legs, core, biceps, triceps). No new groups are added in this feature.
- The limit of three groups is a product default. It keeps a session short enough to finish in the requested time.
- Time is shared evenly between groups by default. A user cannot set custom shares in this release.
- Single-group behavior is unchanged, so existing bookmarks and connector prompts keep working.
- Mood, the safety notice, and the gentle-mood 45-minute cap apply exactly as they do today.
- No selection or plan is saved. Saving sessions or history is out of scope and would need its own specification.
- Users are English-speaking; the notices follow the app's wording.
