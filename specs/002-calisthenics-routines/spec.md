# Feature Specification: Calisthenics Routines and Adult Buddy Icon

**Feature Branch**: `002-calisthenics-routines` (not created; this repo commits directly to `main`)

**Created**: 2026-11-01

**Status**: Draft

**Input**: User description: "add in the menu the option for calisthenics as well, add more routines, and make the buddy icon for adults"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Pick calisthenics from the menu (Priority: P1)

A signed-in user opens the home screen, sees "Calisthenics" alongside the other muscle groups, taps it, and gets bodyweight routine ideas that match their mood.

**Why this priority**: It is the requested menu change and the smallest slice that delivers the new category end to end.

**Independent Test**: Sign in, tap "Calisthenics" in the muscle group menu, and confirm one to three routines appear, each with equipment and duration.

**Acceptance Scenarios**:

1. **Given** the home screen is open, **When** the user looks at the muscle group menu, **Then** "Calisthenics" appears as one of the options.
2. **Given** "Calisthenics" is selected with no mood, **When** the results load, **Then** only calisthenics routines are shown.
3. **Given** "Calisthenics" and the mood "Stressed" are selected, **When** the results load, **Then** the routines shown are calm, low-intensity options.

---

### User Story 2 - Browse the full calisthenics library (Priority: P2)

A user opens the calisthenics library page, filters by intensity and maximum length, and opens a routine's detail page.

**Why this priority**: Browsing extends the category; it needs User Story 1 to exist first.

**Independent Test**: Open the calisthenics library, filter to low intensity and 20 minutes or less, and confirm every result matches both filters.

**Acceptance Scenarios**:

1. **Given** the calisthenics library is open, **When** the user chooses intensity "low" and "20 min", **Then** every listed routine matches both.
2. **Given** a routine is listed, **When** the user opens it, **Then** the detail page shows its equipment, duration, intensity, and any caution.

---

### User Story 3 - Recognisable adult buddy icon (Priority: P3)

A user sees the app in a browser tab, a bookmark, or on a phone home screen and recognises it as a grown-up gym companion rather than a children's character.

**Why this priority**: Visual identity matters but does not block any functionality.

**Independent Test**: Open the site on a phone home screen or a browser tab and confirm the icon shows the buddy mark on a dark tile at 32 px and 180 px.

**Acceptance Scenarios**:

1. **Given** the site is open in a browser tab, **When** the user looks at the tab, **Then** the icon shows the buddy mark on a dark tile.
2. **Given** the site is saved to a phone home screen, **When** the icon is shown, **Then** it is legible at 180 px.

---

### Edge Cases

- What happens when a user selects "Calisthenics" together with a mood that no calisthenics routine matches? The page shows the closest matches with the existing "not a perfect match" note.
- What happens when a high-intensity routine is shown? It always shows its caution note.
- What happens on a 320 px wide phone? The new menu tile wraps like the others with no horizontal scroll.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The muscle group menu MUST include a "Calisthenics" option and a "Stretching" option alongside the existing eight.
- **FR-002**: The library MUST contain at least 12 calisthenics routines and at least 8 stretching routines, each valid under the existing template rules.
- **FR-008**: Stretching routines MUST be low or moderate intensity and MUST NOT require equipment beyond a mat or a chair.
- **FR-003**: Every calisthenics routine with high intensity MUST include a caution note.
- **FR-004**: Calisthenics routines MUST span low, moderate, and high intensity and cover at least four moods.
- **FR-005**: The existing eight focus areas, their identifiers, and their routines MUST remain unchanged.
- **FR-006**: The site MUST provide an adult buddy icon at 32 px, 180 px, and 512 px.
- **FR-007**: The muscle group menu MUST keep working on a 320 px wide screen with no horizontal scrolling.

### Key Entities *(include if feature involves data)*

- **Calisthenics focus area**: a new muscle group identifier with a label and a one-line description.
- **Calisthenics routine**: a library template in the calisthenics focus area, with name, moods, duration, intensity, equipment, description, and optional caution.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can reach calisthenics routines in one tap from the home screen.
- **SC-002**: The library holds at least 12 calisthenics routines, and the content check passes with zero errors.
- **SC-003**: All existing tests keep passing except the ones that count focus areas, which are updated to the new count.
- **SC-004**: The buddy icon is recognisable in a browser tab at 32 px.

## Assumptions

- Calisthenics means bodyweight strength and control, using at most a pull-up bar, a dip bar, rings, a wall, or a sturdy chair or table.
- Stretching means guided mobility and recovery holds for adults, with no weights and no high-intensity work.
- Routines are written for adults who have already been cleared for exercise. The app is not medical advice, as the existing notice states.
- The adult buddy icon reuses the existing Pip character, without the sprout and blush, on a dark tile.
- The repository commits directly to `main`, so no feature branch is created.

## Out of Scope

- Weekly workout schedules, progression plans, and user-created routines.
- Changes to the mood list, the suggestion rules, or authentication.
