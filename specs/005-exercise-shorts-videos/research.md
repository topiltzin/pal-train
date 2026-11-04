# Research: Exercise Demo Shorts

**Feature**: 005-exercise-shorts-videos | **Date**: 2026-11-04

Each decision below answers one open question from the plan's Technical Context.

## 1. Where the demo links are stored

**Decision**: A new table, `exercise_demo_links`, in the app's existing Neon Postgres database, managed with Drizzle and migrated with `drizzle-kit` like the existing tables.

**Rationale**: The request asks for the links to be stored in a database. The app already has one, with migrations and integration tests against it, so a new table adds no new infrastructure.

**Alternatives considered**:
- A separate database: needs its own credentials, backups, and migration path for no gain at this size.
- Adding the URL to each exercise's JSON file: the spec requires the links to live in the database so they can change without a code release.

## 2. How the video plays in the page

**Decision**: A native `<dialog>` opened with `showModal()`, holding an `<iframe>` that points at `https://www.youtube-nocookie.com/embed/<videoId>` (privacy-enhanced mode). The iframe is created only when the dialog opens and removed when it closes.

**Rationale**: The native dialog gives focus containment, an inert background, Escape handling, and the top layer for free, which covers FR-003 and FR-009 without custom code. Creating the iframe on open keeps the video host out of the page until the user asks (FR-004). This is the same approach `~/lvprime` uses for its in-page exercise videos (its `video-dialog.js` and `video-embed.js`); it is ported to TypeScript rather than copied, and adds no dependency.

**Alternatives considered**:
- The YouTube IFrame API: needs an extra script and more code to do what a plain embed URL already does.
- A third-party player package: adds a dependency the constitution asks to justify, for a single embed URL.
- Opening YouTube in a new tab: rejected by the spec (FR-002).

## 3. What counts as a valid video reference

**Decision**: Store only the 11-character YouTube video id, never the full URL. A value is valid when it matches `^[A-Za-z0-9_-]{11}$`. The Short's page URL (`https://www.youtube.com/shorts/<id>`) is built from the id when a fallback link is needed.

**Rationale**: Storing a bare id means a stored value can never point the embed at an arbitrary host (FR-007). The rule is one regular expression, tested as a pure function.

**Alternatives considered**: Storing and parsing full URLs (as `~/lvprime` does for user-entered links). The lvprime pattern exists because its links are free text. Here the links come from a reviewed list, so a bare id is safer and simpler.

## 4. How the links reach the page

**Decision**: The session-plan response adds a `demo` field to each exercise, filled from one query for all the plan's exercises.

**Rationale**: The page already loads the plan, so the links arrive in the same request, with no second round trip and no loading state. One batched query keeps the cost flat as the plan grows.

**Alternatives considered**: A separate `/api/exercises/<id>/demo` endpoint per exercise. That is one request per row and adds loading states for no benefit.

## 5. How the Shorts are matched to exercises

**Decision**: Matching is a human review of the channel's Shorts against the exercise names. The channel was read on 2026-11-04: 48 Shorts, 42 with readable titles and 6 "Untitled". A loose keyword scan produced many false matches, so the reviewed result is recorded in `demo-links.reviewed.csv` and imported by a script. Only rows marked `accept` are imported.

**Rationale**: Titles alone are ambiguous ("Dumbbell curl" matches a dumbbell row video). A person decides, and the CSV keeps the decision reviewable and repeatable.

**Alternatives considered**: Fully automatic matching: rejected because the scan's false matches would reach users.

## 6. What happens when the database is unavailable

**Decision**: The plan still returns, with `demo: null` on every exercise, and the failure is logged with the request context. The exercise list is never blocked by the demo lookup.

**Rationale**: Demo links are an enhancement. A missing link must not stop a user from getting a session (constitution I: errors handled explicitly, not hidden, and user-facing messages stay clear).

## 7. Keeping one active link per exercise

**Decision**: A partial unique index on `exercise_id` where `active` is true, plus an insert that, in one transaction, deactivates the current active row before inserting the new one.

**Rationale**: The database enforces FR-006 even if two imports race. The transaction makes "newest one wins" a single step.

## 8. Load timeout and fallback

**Decision**: A 10-second timer starts when the dialog opens. If the iframe has not fired its load event by then, the window shows a short message and an "Open on YouTube" link, and the iframe is removed.

**Rationale**: Matches FR-008. The timer and its cleanup are one small function, tested with fake timers.
