# Feature Specification: Upper Body, Shoulder, and Core Options

**Feature Branch**: `004-upper-body-shoulder-core` (not created; this repo commits directly to `main`)

**Created**: 2026-11-03

**Status**: Draft

**Input**: User description: "add the upper-body, shoulder, core option as well; check the routines for the level"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Pick upper body, shoulders, or core from the menu (Priority: P1)

A signed-in user opens the home screen, sees "Upper body", "Shoulders", and "Core" in the muscle group menu next to the existing areas, taps one, and gets routine ideas that match their mood.

**Why this priority**: It is the requested menu change and the smallest slice that delivers all three new areas end to end.

**Independent Test**: Sign in, tap each of the three new options, and confirm each shows routines that belong to that area.

**Acceptance Scenarios**:

1. **Given** the home screen is open, **When** the user looks at the muscle group menu, **Then** "Upper body", "Shoulders", and "Core" appear as options alongside the existing areas.
2. **Given** "Shoulders" is selected with no mood, **When** the results load, **Then** only shoulder routines are shown.
3. **Given** "Core" and the mood "Stressed" are selected, **When** the results load, **Then** the routines shown are core routines at low intensity, or the closest matches if none fit exactly.

---

### User Story 2 - Browse each new area in the library (Priority: P2)

A user opens the library page for upper body, shoulders, or core, filters by intensity and maximum length, and opens a routine's detail page.

**Why this priority**: Browsing extends the three new areas and needs User Story 1 to exist first.

**Independent Test**: Open the shoulders library, filter to moderate intensity and 30 minutes or less, and confirm every listed routine matches both filters.

**Acceptance Scenarios**:

1. **Given** the shoulders library is open, **When** the user chooses intensity "moderate" and "30 min", **Then** every listed routine matches both.
2. **Given** a routine in any new area is listed, **When** the user opens it, **Then** the detail page shows its equipment, duration, intensity, and any caution.

---

### User Story 3 - Each routine states its level clearly (Priority: P3)

A user can tell how hard a routine is before starting it, because every routine shows its intensity level in plain words, and every high-intensity routine carries a caution.

**Why this priority**: The level check fixes the existing library's labels and gives users the information they need to choose safely. It does not block the new areas from working.

**Independent Test**: Open any routine and confirm its level is shown as one of "Low", "Moderate", or "High", and that every "High" routine shows a caution.

**Acceptance Scenarios**:

1. **Given** any routine is open, **When** the user reads its details, **Then** the level appears as "Low", "Moderate", or "High", with a one-line meaning for that level.
2. **Given** a high-intensity routine is open, **When** the user reads its details, **Then** a caution is visible on the same screen.

---

### Edge Cases

- What happens when a mood has no routine in a new area? The app shows the closest matches and says they are closest matches, the same as the existing areas.
- What happens when a routine could fit both "Upper body" and "Chest" or "Back"? It belongs to one area only. The area with the closest main target is chosen, and the other area does not repeat it.
- What happens when a new area's library is unavailable? The same library-unavailable message appears as for the existing areas.
- What happens to the existing routines that fail the level check? They are kept and corrected, not removed. The check reports each change so the owner can review it.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The muscle group menu MUST offer three new options: "Upper body", "Shoulders", and "Core".
- **FR-002**: Each new option MUST have at least 8 routines in the library, with at least 2 routines at each of the three intensity levels.
- **FR-003**: Each new option MUST have at least 10 exercises available for session planning, covering at least one exercise at each intensity level.
- **FR-004**: Every routine and exercise MUST have exactly one intensity level from "low", "moderate", or "high".
- **FR-005**: Every routine and exercise with the "high" intensity level MUST carry a caution.
- **FR-006**: Every routine and exercise MUST belong to exactly one muscle group option.
- **FR-007**: The existing routines MUST be checked for level. Each check MUST record the routine, its current level, the level it was given, and the reason. Where the level does not match the routine's effort, the level MUST be corrected and the change listed for review.
- **FR-008**: The intensity level MUST be shown on every routine detail page as "Low", "Moderate", or "High", with a one-line meaning for that level.
- **FR-009**: The library MUST allow filtering the new areas by intensity and maximum length, using the same filters as the existing areas.
- **FR-010**: Mood matching for the new areas MUST use the same mood list as the existing areas.
- **FR-011**: The existing areas, routes, and their routines MUST keep working unchanged apart from the level corrections in FR-007.

### Key Entities

- **Muscle Group Option**: A selectable area on the home screen and in the library, with a name, a short description, and a set of routines and exercises. The three new options are added to the existing list.
- **Routine**: A workout idea in one muscle group option, with a name, moods, duration, intensity level, equipment, description, and optional caution.
- **Exercise**: A single movement used when building a session, with a name, minutes, intensity level, equipment, moods, and optional caution.
- **Level Check Record**: One entry per routine checked, with the routine, its previous level, its new level, and the reason.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can reach a routine in each of the three new areas in no more than two taps from the home screen.
- **SC-002**: 100% of routines and exercises carry exactly one level, and 100% of high-intensity items show a caution.
- **SC-003**: 100% of the existing routines have a level check record, and every corrected level is listed for review.
- **SC-004**: Each new area has at least 8 routines covering all three levels, and at least 10 exercises, as confirmed by the content check.
- **SC-005**: At least 9 out of 10 users can name the level of a routine they have just opened without reading the description.

## Assumptions

- **"Level" means intensity**: The library already labels routines and exercises as "low", "moderate", or "high". This feature uses those labels rather than adding a separate beginner, intermediate, and advanced scale, to avoid a second system to maintain.
- **Level check scope**: The check covers the routines already in the library and the exercises used for session planning. It corrects labels that do not match the routine's effort, and it does not rewrite routine descriptions.
- **Authoring new routines**: Routine and exercise content for the three new areas is written as part of this feature. The content check enforces the minimums in FR-002 and FR-003.
- **Area boundaries**: "Upper body" covers pressing and pulling work for the torso and arms that is not specific to chest or back. "Shoulders" covers deltoid and rotator-cuff work. "Core" covers trunk stability, bracing, and rotation. Routines that are mainly chest or back stay in those areas.
- **Scope**: Only the muscle group menu, the library pages for the three new areas, the session planner's exercise data, and the level check change. The mood list, the navigation, and the sign-in flow are out of scope.
- **Medical content**: The existing medical notice stays on the home screen and applies to every routine.
