# Feature Specification: Mood-Based Gym Companion

**Feature Branch**: `001-mood-gym-companion`

**Created**: 2026-10-31

**Status**: Draft

**Input**: User description: "build a web page focus on a Pal/Buddy/friend gym companion, we are not trainer or coach the idea will be handle multiples training option focus on the mood of the person. so if he want to train chess.. lets suggest a nice proposal routine. based on a multiple at least 100 templates made by /fitness-coach focus on the classic muscles, bicep routine, or tricep routine, or back, or chess or legs, or cardio, or for Hyrox focus, or for condition.. not a routine but we only suggest base don the mood"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Pick a Mood and Get a Workout Idea (Priority: P1)

A gym-goer opens the page, says how they feel right now (for example, energized, tired, stressed, or
just want to sweat), and the page offers a few workout ideas that fit that mood. The page speaks like
a friend in the gym, not a coach: it suggests and never prescribes.

**Why this priority**: This is the core value. Without a mood-to-suggestion flow, there is no product.

**Independent Test**: Open the page, select one mood, and confirm that between one and three
workout suggestions appear, each labeled with a focus area and a short description.

**Acceptance Scenarios**:

1. **Given** the page is open with no mood selected, **When** the user selects "Energized", **Then** at least one suggestion for a high-intensity focus area is shown, and the page states that these are ideas, not a prescribed plan.
2. **Given** the user selected "Tired", **When** suggestions appear, **Then** each suggestion has a low-to-moderate intensity label.
3. **Given** the user has not selected a mood, **When** they look at the suggestions area, **Then** no workout is shown and the page invites them to pick a mood.

---

### User Story 2 - Choose a Focus Area Directly (Priority: P2)

A user who already knows what they want to train (for example, chest, biceps, legs, cardio, or a
Hyrox-style session) can select a focus area and see mood-matched ideas for that area, without
having to pick a mood first.

**Why this priority**: It covers users who arrive with a clear goal. It extends the core flow but is
not needed to deliver the basic mood-based value.

**Independent Test**: Select "Legs" with no mood set, and confirm that only leg-focused ideas appear,
each with a mood label showing how well it fits.

**Acceptance Scenarios**:

1. **Given** the user selects the focus area "Back", **When** no mood is set, **Then** suggestions for back are shown, each tagged with the moods it fits.
2. **Given** the user selects both a mood and a focus area, **When** suggestions appear, **Then** only ideas that match both are shown.
3. **Given** no idea matches the selected combination, **When** the user views results, **Then** the page shows the closest matches and says that the match is partial.

---

### User Story 3 - Browse the Template Library and Shuffle (Priority: P3)

A user who wants more choice can shuffle to a new suggestion or browse the full library of
templates for a focus area.

**Why this priority**: It adds variety and depth. The core product works without it.

**Independent Test**: Request a new suggestion several times for the same mood and confirm that the
results change and do not repeat the immediately previous suggestion.

**Acceptance Scenarios**:

1. **Given** suggestions are displayed, **When** the user taps "Another idea", **Then** a different template for the same mood and focus appears.
2. **Given** the user opens the library for "Cardio", **When** the list loads, **Then** every cardio template is listed with its name, duration, and intensity.

---

### Edge Cases

- What happens when the user changes mood after seeing suggestions? The results update to the new mood, and the previous suggestions are cleared.
- What happens when a user selects a focus area that has very few templates for their mood? The page shows the available templates and states that the set is small, instead of showing an empty state.
- What happens if the user has a limited time window? Each template shows its approximate duration so users can filter by time they have; no template is shown as mandatory.
- What happens with users who report pain or injury? The page shows a visible notice that suggestions are not medical advice, and a suggestion containing a warning (for example, heavy lifting) is labeled as such.
- What happens when the user is on a phone? All content and controls remain usable at a narrow screen width without horizontal scrolling.
- What happens if the template library fails to load? The page shows a clear message and keeps the mood and focus controls visible.
- What happens when a signed-out visitor opens the page? They see the buddy and a sign-in screen, and no workout content is shown.
- What happens when sign-in fails? The page shows a clear message that the email or password is not recognized and keeps the sign-in form filled in.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The page MUST present a set of mood options. The initial set MUST include at least: Energized, Tired, Stressed, Focused, Playful, Unmotivated, and Want to Sweat.
- **FR-002**: The page MUST present focus areas. The initial set MUST include: Chest, Biceps, Triceps, Back, Legs, Cardio, Hyrox-style, and Conditioning.
- **FR-003**: The page MUST show workout suggestions only, using language such as "idea" or "suggestion". It MUST NOT present a suggestion as a required routine or a coaching instruction.
- **FR-004**: The page MUST show suggestions that match the selected mood, the selected focus area, or both. When both are selected, a suggestion MUST match both.
- **FR-005**: The template library MUST contain at least 100 workout templates in total, spread across all focus areas, and each focus area MUST have at least 8 templates.
- **FR-006**: Each template MUST include: a name, a focus area, the moods it fits, an approximate duration, an intensity level (low, moderate, or high), the equipment needed, and a short description of the idea.
- **FR-007**: The page MUST show between one and three suggestions at a time, and MUST provide a way to request a different suggestion for the same selection.
- **FR-008**: The page MUST NOT repeat the immediately previous suggestion when the user requests another one, unless only one template matches.
- **FR-009**: The page MUST let the user browse the full template list for any focus area, and MUST let the user filter that list by intensity and by approximate duration.
- **FR-010**: The page MUST show a notice that suggestions are not medical advice and that users should consult a professional for pain, injury, or health conditions.
- **FR-011**: Templates with a safety caution (for example, maximal lifts or high-impact cardio) MUST display that caution alongside the suggestion.
- **FR-012**: The page MUST require sign-in before any suggestion is shown. Sign-in MUST collect only what is needed to identify the user (for example, an email address and a password), and MUST NOT require health or medical data.
- **FR-013**: The page MUST remain fully usable on phone and desktop screen sizes.
- **FR-014**: If the template library cannot be loaded, the page MUST show an error message that explains the problem and MUST keep the mood and focus controls available.
- **FR-015**: The page MUST be written in plain, friendly language and MUST NOT use coaching jargon or assume prior training knowledge.
- **FR-016**: Signed-out visitors MUST see a sign-in screen that introduces the buddy. They MUST be able to create an account and sign in again later, and they MUST be able to sign out.
- **FR-017**: The page MUST present a friendly buddy persona that talks like a gym friend, not a coach. It MUST use a fun, playful visual style that changes its look and copy to reflect the selected mood.
- **FR-018**: Signed-in users MUST be greeted by name, and the page MUST keep the mood and focus controls available after sign-in.

### Key Entities *(include if feature involves data)*

- **Mood**: A named feeling the user can select (for example, Energized). Attributes: name, short description, intensity range it favors.
- **Focus Area**: A training theme (for example, Legs or Hyrox-style). Attributes: name, short description.
- **Workout Template**: A ready-made workout idea. Attributes: name, focus area, moods it fits, approximate duration, intensity level, equipment, description, optional safety caution.
- **Suggestion Session**: The current set of one to three templates shown to the user for their selection, plus the most recently shown template so repeats can be avoided.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time user can go from opening the page to seeing a suggestion in under 15 seconds.
- **SC-002**: Every mood option shows at least one suggestion, and every focus area shows at least 8 templates.
- **SC-003**: The library contains at least 100 workout templates at launch.
- **SC-004**: At least 90% of test users say that the suggested idea matches the mood they selected when asked after a short session.
- **SC-005**: At least 90% of test users can understand that suggestions are ideas, not required routines, without reading any help text.
- **SC-006**: The page remains fully usable at a phone-width screen with no horizontal scrolling for the primary flow.
- **SC-007**: A new user can create an account and see their first suggestion in under 2 minutes, without entering health or medical information.
- **SC-008**: No suggestion is shown to a signed-out visitor.

## Assumptions

- "Chess" in the input refers to "chest", since chest is a standard focus area alongside biceps, triceps, and back. This is a documented default, not a scope change.
- "Hyrox focus" refers to a Hyrox-style session (a functional fitness race format), not an official Hyrox product or event name.
- "Condition" refers to general conditioning work, shown as its own focus area.
- The 100+ template library is created as content for this feature, and it is produced with the fitness-coach skill. Generating the library is a separate task from this specification (see Next Actions in the completion report).
- Templates are general ideas for healthy adults. They are not personalized to a user's fitness level, injuries, or goals in version 1.
- Moods are selected from a fixed list. Free-text mood entry is out of scope for version 1.
- Sign-in is required for every use. Account sign-in uses email and password in version 1; social sign-in and password reset are not in scope unless added later.
- Mood history, saved favorites, and personal workout tracking are out of scope for version 1.
- The fun, playful visual direction is a product requirement for this spec. The concrete visual design and component choices are decided in the planning phase, using the design-taste-frontend guidance.
- The product is a single web page experience, not a native mobile app.
- Users have a basic understanding of common gym equipment names such as dumbbell, barbell, bench, and kettlebell.
