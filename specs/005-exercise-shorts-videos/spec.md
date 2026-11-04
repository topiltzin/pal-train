# Feature Specification: Exercise Demo Shorts

**Feature Branch**: `005-exercise-shorts-videos` (not created; this repo commits directly to `main`)

**Created**: 2026-11-04

**Status**: Draft

**Input**: User description: "now create a DB and link to youtube short videos from https://www.youtube.com/@officialdemic/shorts if possible to each of the exercises, and once it click it should open a window in same page dont go to youtube, insert on DB and link it on the page"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Watch an exercise demo without leaving the page (Priority: P1)

A signed-in user is looking at an exercise in the library or in a session plan. Where the exercise has a demo Short, a "Watch demo" control is shown. The user taps it, and the Short plays in a window on top of the same page. Closing the window returns the user to exactly where they were. They never leave the app for YouTube.

**Why this priority**: This is the request itself, and it is the smallest slice that delivers the value end to end: a demo a user can watch in place.

**Independent Test**: Sign in, open an exercise that has a linked Short, tap "Watch demo", confirm the video plays in a window, the address bar still shows the app page, and closing the window returns to the same scroll position.

**Acceptance Scenarios**:

1. **Given** an exercise with a linked Short is on screen, **When** the user taps "Watch demo", **Then** a window opens on the same page and plays that Short.
2. **Given** the demo window is open, **When** the user looks at the browser address, **Then** it is still the app page, not YouTube.
3. **Given** the demo window is open, **When** the user closes it with the close button, the backdrop, the Escape key, or the browser Back action, **Then** the window closes, playback stops, and the user is back on the same page at the same place.
4. **Given** an exercise has no linked Short, **When** the user views it, **Then** no "Watch demo" control is shown for it.

---

### User Story 2 - Keep the demo links in the app's database (Priority: P2)

The app stores each exercise's demo link in its database, so the link set can be added to, corrected, or removed without changing the app's code. Each stored link records which exercise it belongs to, the Short's video identifier, the Short's title from the channel, and when it was added. Exercise pages read the links from the database, so a newly stored link appears without a release.

**Why this priority**: The request asks for the links to be stored in a database. It depends on Story 1 for its visible value, so it comes second.

**Independent Test**: Insert one link for an exercise directly in the database, reload the exercise, and confirm the "Watch demo" control appears and opens that Short. Remove the link and confirm the control disappears.

**Acceptance Scenarios**:

1. **Given** a link is stored for an exercise, **When** the exercise is shown, **Then** its "Watch demo" control opens that Short.
2. **Given** a stored link is removed, **When** the exercise is shown, **Then** no "Watch demo" control is shown.
3. **Given** an exercise has a stored link, **When** a second link is added for the same exercise, **Then** the exercise keeps exactly one active link, the newest one.

---

### User Story 3 - Match the channel's Shorts to the exercise list (Priority: P3)

The team reviews the channel's Shorts and links each one to the exercise it demonstrates. A Short is only linked when its title clearly names the exercise. Shorts with no readable title are left unlinked. The result is a reviewed list of exercise-to-Short links, and a record of which exercises still have no demo.

**Why this priority**: The links are only useful once they are correct. Matching is a one-time curation step that follows the storage and display work.

**Independent Test**: Run the matching over the channel's Shorts and confirm every stored link names the same movement as its exercise, and that the record lists the exercises with no demo.

**Acceptance Scenarios**:

1. **Given** a Short titled with a movement that matches an exercise, **When** it is reviewed, **Then** it can be linked to that exercise.
2. **Given** a Short with no readable title, **When** it is reviewed, **Then** it is not linked.
3. **Given** the review is complete, **When** the team checks the record, **Then** every exercise is listed either with its Short or as having no demo.

---

### Edge Cases

- A linked Short is later made private, deleted, or blocked: the window shows a clear message and an "Open on YouTube" link instead of a blank frame, and the rest of the page is unaffected.
- The video takes too long to load: after 10 seconds the window shows the same message and the fallback link.
- A Short's title names two movements (for example, a list of moves): it is linked only to the exercise it clearly centres on, or left unlinked when none does.
- The same Short is linked to two exercises: allowed, because a Short can demonstrate related moves.
- The user is offline when opening the window: the message and fallback link are shown.
- A stored link has a malformed or non-YouTube address: it is not shown as a demo; the control is hidden rather than sending the user anywhere else.
- Six of the channel's Shorts have no title ("Untitled"): they are not linked by title and are left for a later review.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The app MUST show a "Watch demo" control on each exercise that has an active linked Short, and MUST NOT show it on exercises without one.
- **FR-002**: Activating "Watch demo" MUST open a window on the current page that plays the linked Short. The app MUST NOT navigate away from the page to YouTube.
- **FR-003**: The demo window MUST close by its close button, a click on the backdrop, the Escape key, and the browser Back action. Closing MUST stop playback and return focus to the control that opened it.
- **FR-004**: The demo window MUST use a privacy-enhanced YouTube player, so that no video host loads until the user opens the window.
- **FR-005**: The app MUST store each demo link in its database with: the exercise identifier, the Short's video identifier, the Short's title as shown on the channel, the channel name, and the date added.
- **FR-006**: Each exercise MUST have at most one active demo link. Adding a newer link MUST make it the active one.
- **FR-007**: A stored link whose address is not a recognisable YouTube video MUST NOT be shown as a demo.
- **FR-008**: If a demo does not load within 10 seconds, or the video cannot be played, the window MUST show a short message and an "Open on YouTube" link, and MUST NOT show a blank frame.
- **FR-009**: The demo window MUST be keyboard operable and announced to screen readers with the exercise name as its label.
- **FR-010**: A Short MUST be linked to an exercise only when its channel title names that exercise's movement. Shorts with no readable title MUST NOT be linked.
- **FR-011**: The demo links and the window MUST be available only to signed-in users, like the rest of the app.
- **FR-012**: The app MUST keep the exercise list itself unchanged in meaning: adding demo links MUST NOT change an exercise's name, focus area, mood, intensity, or equipment.

### Key Entities

- **Exercise**: An existing item in the workout library, identified by its existing exercise identifier. Demo links attach to it; no existing attribute changes.
- **Exercise Demo Link**: A stored association between one exercise and one YouTube Short. Attributes: the exercise identifier, the Short's video identifier, the Short's title as shown on the channel, the channel name (officialdemic), the date added, and whether it is the active link for that exercise.
- **Channel Short**: A video on the channel's Shorts page. Used as the source of the links; its title is the basis for matching. Not stored on its own; only the links are.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can open an exercise's demo and be watching it within two taps or clicks, without the page address changing.
- **SC-002**: Every stored demo link either plays in the window or shows the fallback message, in 100% of tested cases, including the edge cases above.
- **SC-003**: At least 8 exercises have a verified demo link at launch, each matched to a Short whose title names the same movement. Coverage of the full library is not a launch goal (see Assumptions).
- **SC-004**: After closing the window, the user is back at the same place on the page in 100% of tested cases, and focus returns to the control that opened it.
- **SC-005**: A demo link can be added, changed, or removed without a code release, and the change is visible on the exercise page within one reload.

## Assumptions

- The channel's Shorts are public and their owner allows them to be embedded. Embedding through YouTube's official player is the standard way to show a public video in a web page.
- Matching is by title, reviewed by a person. The six Shorts with no title are not matched by title and are left out of this release.
- The channel covers only part of the library. A keyword scan of the 42 titled Shorts against the 130 exercises gives many loose candidates, but most are false (for example, a dumbbell curl matched to a dumbbell row video). A strict reading finds roughly 6 to 10 true matches, such as the lat pulldown, the bench press, the one-arm dumbbell row, and the rear delt face pull. The rest of the library would need demos from another source; that is out of scope here.
- Demo links are stored in the app's existing database, in a new table next to the exercise data. No separate database is created.
- Exercises keep their current content files; the links live only in the database, so the library's source files are not edited to add them.
- Only signed-in users can open the app, so the demo links need no separate access rules.
- "Exercise" means the entries in the workout library (130 at present). Workout templates link to exercises by their own pages and are not given separate demo links in this release.
- The exact matching rules, the storage design, and the review workflow are decided in the planning phase.
