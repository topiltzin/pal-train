# Research: Workout Timer with Finish Celebration

**Feature**: 009-workout-timer | **Date**: 2026-11-08

## 1. How the countdown keeps accurate time (FR-008)

**Decision**: Store the moment the timer should end (`endAt`, from the real clock). Each display update computes the remaining time as `endAt - now`. A pause stores the remaining milliseconds; a resume sets a new `endAt`.

**Rationale**: Browsers throttle timers in background tabs, and a tick counter drifts. Comparing against the real clock is always correct. When the user returns to the tab, the next update shows the true remaining time and fires the finish if the end has passed.

**Alternatives considered**: Counting ticks (`remaining -= 250`). Rejected: drifts in background tabs. A worker thread. Rejected: no benefit at this scale and more code.

## 2. Playing the sound (FR-004)

**Decision**: Synthesise one short chime with the Web Audio API (two sine tones with a quick decay). Create the audio context inside the Start tap, which counts as the user gesture browsers require.

**Rationale**: No asset to download, nothing to load before the first tap, and it works offline. The chime is short and pleasant, matching the spec's assumption.

**Alternatives considered**: An MP3 or WAV file. Rejected: adds an asset and a load delay that can miss the first moment. A Web Speech voice reading "done". Rejected: language and voice vary by device and can be unpleasant.

**Failure handling**: If the audio context cannot be created or resumed, the chime does nothing and the celebration still shows (spec edge case).

**Known limit**: A muted device gives no sound. The app cannot detect the device mute switch, so this is accepted (spec US1 scenario 5).

## 3. Sound while the tab is in the background (spec US1 scenario 4)

**Decision**: The sound and celebration fire when the app next runs its update: a `visibilitychange` listener checks the clock immediately when the tab returns, and the regular update covers the rest.

**Rationale**: Background tabs cannot be relied on to run a timer on time. Checking on return keeps the finish correct and visible the moment the user comes back. The spec accepts that the sound may come on return rather than at the exact moment.

## 4. The celebration effect (FR-006, FR-007)

**Decision**: CSS only. A short burst of a few accent-coloured shapes behind the message, using `transform` and `opacity` keyframes (about 2.5 seconds, then it stays readable). Under `prefers-reduced-motion: reduce` the shapes are not rendered and the message appears without motion.

**Rationale**: The constitution asks for justified dependencies. CSS keeps the effect small, avoids layout work, and makes the reduced-motion rule easy to verify.

**Alternatives considered**: A confetti library. Rejected: a new dependency for one moment. Motion library springs. Rejected: heavier than needed for a single burst.

## 5. Where the timer lives and when it resets (FR-010)

**Decision**: The timer sits under the total minutes in the plan list. The plan list gives the timer a `key` derived from the plan's identity, so a new plan remounts the timer and resets it.

**Rationale**: The timer belongs to the plan it times, and remounting is the simplest correct reset.

## 6. Screen reader announcements (FR-011)

**Decision**: A polite live region announces "Timer started", "Timer stopped", and "Session complete" as text. The celebration itself is a `role="status"` region so its words are read once when it appears.

**Rationale**: Announcements are short text, which every screen reader supports without custom code.

## 7. Design direction (from the design read)

**Reading**: a utility timer for a fitness app, for a user who is mid-workout, with a calm, confident language. Leaning toward the existing Pal Buddy tokens (dark surface, one accent) and restrained motion.

**Decisions**:
- Use the app's existing accent for the controls and the celebration shapes. One accent per page.
- Large tabular numbers for the countdown so the digits do not shift width as they change.
- Buttons are at least 44px tall, with the label on one line at 320px.
- No emoji, no decorative dots, no em-dashes in any visible text.
- Motion intensity is low: one short celebration, no looping animations.

## Open items

None. Every decision above has a default and a reason.
