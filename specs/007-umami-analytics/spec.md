# Feature Specification: Umami Web Analytics

**Feature Branch**: `007-umami-analytics` (not created; this repo commits directly to `main`)

**Created**: 2026-11-05

**Status**: Draft

**Input**: User description: "lest implement https://docs.umami.is/docs for this repo!"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See how people use the app (Priority: P1)

The team opens an analytics dashboard and sees how visitors reach and use Paltrain: page views, where visitors come from, which devices and browsers they use, and which pages they land on. Each page view is recorded without any cookie or consent banner being required by the analytics itself, and without any visitor's name or email being collected.

**Why this priority**: Page-level traffic is the foundation every other insight depends on, and it is the smallest slice that delivers value on its own.

**Independent Test**: Load any public or signed-in page in a browser, then confirm within one minute that the page view appears in the analytics dashboard with the correct page address and referrer.

**Acceptance Scenarios**:

1. **Given** a visitor opens any page of Paltrain, **When** the page finishes loading, **Then** one page view is recorded for that page.
2. **Given** a visitor moves between pages inside the app without a full reload, **When** the address changes, **Then** each new page is recorded as its own page view.
3. **Given** a visitor's browser has Do Not Track enabled, **When** they use the app, **Then** no page views from that browser are recorded.
4. **Given** the analytics service is unreachable, **When** a visitor uses the app, **Then** the app works normally and the visitor sees no error.

---

### User Story 2 - Measure the workout journey with named events (Priority: P2)

The team sees how users move through the core product actions. Each key action is recorded as a named event with no personal data: browsing the exercise library, watching an exercise demo, planning a session, starting and finishing a session, saving a mood check-in, and asking for a suggestion. The team can count each event and compare them over time, so they can tell which features are used and where people stop.

**Why this priority**: Named events turn raw traffic into product insight, and they depend on the page view foundation from Story 1.

**Independent Test**: Perform each tracked action once in the app, then confirm each appears in the dashboard under its own event name, once per action, with no extra fields containing personal data.

**Acceptance Scenarios**:

1. **Given** a user taps "Watch demo" on an exercise, **When** the demo window opens, **Then** one "exercise demo watched" event is recorded with the exercise's identifier.
2. **Given** a user completes a session, **When** the completion screen appears, **Then** one "session completed" event is recorded with the session's length category, not the exercises' personal results.
3. **Given** a user saves a mood check-in, **When** the save succeeds, **Then** one "mood check-in saved" event is recorded that does not include the mood value or any note the user wrote.
4. **Given** a user's action fails, **When** the error is shown, **Then** no success event is recorded for that action.

---

### User Story 3 - Connect activity to a signed-in user without exposing identity (Priority: P3)

When a user signs in, the analytics record links that user's sessions across devices using an opaque internal identifier. The team can see that the same person returned on a phone and a laptop, and can count returning users, without ever seeing a name, email address, or any health value attached to that identifier. When the user signs out, new activity is no longer linked to that identifier.

**Why this priority**: Returning-user insight is valuable, but it adds the most privacy responsibility, so it comes after anonymous traffic and events are working.

**Independent Test**: Sign in on two browsers, perform an action in each, and confirm the dashboard shows one linked user with two sessions and no name or email in any field. Sign out in one browser and confirm its later actions are not linked.

**Acceptance Scenarios**:

1. **Given** a user signs in, **When** the app knows who they are, **Then** the analytics identifier is an opaque internal ID, never an email address or name.
2. **Given** the same user is signed in on two devices, **When** both record activity, **Then** the dashboard shows one linked identity with activity from both devices.
3. **Given** a user signs out, **When** they continue browsing, **Then** their new activity is recorded as anonymous.

---

### Edge Cases

- What happens when the analytics script is blocked by an ad blocker? The app works normally; the team accepts that blocked visitors are not counted. The docs' option to serve the script under a custom path is recorded as a follow-up, not built here.
- What happens when a visitor is on a shared device and signed in as someone else? Activity is linked only after an explicit sign-in, and signing out stops linking.
- What happens when an event name exceeds the analytics service's limit? The name is kept within the limit by design; no event is sent with a truncated or unreadable name.
- What happens when a user repeatedly taps a tracked button? Each completed action records one event; a tap that does not complete the action records none.
- What happens when a page is loaded during server rendering, where the browser-only analytics object does not exist? Tracking calls are skipped safely, and the page renders without error.
- What happens when the analytics service stores data indefinitely? Retention is controlled by the self-hosted instance's own settings and is covered in Assumptions.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST record one page view for each full page load and each in-app page change.
- **FR-002**: The system MUST NOT store cookies for analytics purposes.
- **FR-003**: The system MUST respect the browser Do Not Track signal by not recording page views or events from that browser.
- **FR-004**: The system MUST record the named events listed in User Story 2 only when the corresponding action succeeds.
- **FR-005**: Event data MUST NOT contain names, email addresses, mood values, mood notes, body measurements, or any other personal or health detail the user entered.
- **FR-006**: When a user is signed in, the system MUST identify them to analytics using only an opaque internal identifier.
- **FR-007**: When a user signs out, the system MUST stop linking subsequent activity from that browser to their identifier.
- **FR-008**: The system MUST NOT block or slow the app's first useful display while the analytics script loads.
- **FR-009**: The app MUST keep working with no visible error when the analytics service is unavailable.
- **FR-010**: Analytics settings (the site identifier and the service address) MUST come from configuration, not be typed into source code.
- **FR-011**: The system MUST exclude the team's own internal and development traffic from production reporting.
- **FR-012**: Tracking calls MUST be safe to run during server rendering, where the browser analytics object does not exist.
- **FR-013**: The system MUST NOT record session replays, heatmaps, or keystrokes.

### Key Entities

- **Analytics Site**: The single Paltrain website registered in the analytics service. Attributes: site identifier, allowed hostnames, environment (production or development).
- **Page View**: One visit to a page. Attributes: page address without personal query values, referrer, device type, browser, approximate location, time.
- **Tracked Event**: A named action such as "exercise demo watched". Attributes: event name, the non-personal identifiers it needs (for example an exercise identifier), time.
- **Analytics Identity**: An opaque internal identifier representing a signed-in user. It carries no name, email, or health data.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every page load and in-app page change appears in the analytics dashboard within 1 minute.
- **SC-002**: Each of the six events in User Story 2 appears once per completed action in a manual test of 10 actions each.
- **SC-003**: 0 analytics records contain an email address, name, mood value, mood note, or body measurement in a review of recorded samples.
- **SC-004**: The app's first useful display is not delayed by the analytics script in a before-and-after comparison on a mid-range phone over a typical mobile connection.
- **SC-005**: With the analytics service turned off, 100% of core flows (browse, watch demo, plan and finish a session, save mood) complete without a visible error.
- **SC-006**: Visitors with Do Not Track enabled produce zero page views and zero events in a test run.

## Assumptions

- The team self-hosts Umami on infrastructure it controls, because that keeps analytics data in its own hands. Umami Cloud is not used for this feature.
- The self-hosted instance uses the analytics service's standard tracking script and API; no custom analytics backend is built.
- Data retention is the self-hosted instance's default unless the team changes it; the team owns the retention decision and will document it in the privacy policy.
- Because the analytics service uses no cookies, no consent banner is added for analytics alone. This will be re-checked if other trackers are added later.
- Session replays, heatmaps, and A/B testing are out of scope. They are paid features in Umami and are not needed for the stated goals.
- The sign-in system already provides a stable internal user identifier that can be used as the opaque analytics identity.
- Exercise, session, and mood features already exist in the app; this feature adds recording only, not new product behavior.
- Event names follow the naming in User Story 2 and may be refined during planning without changing user outcomes.
