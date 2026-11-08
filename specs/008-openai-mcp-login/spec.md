# Feature Specification: OpenAI MCP Sign-In for Paltrain

**Feature Branch**: `008-openai-mcp-login` (not created; this repo commits directly to `main`)

**Created**: 2026-11-07

**Status**: Draft

**Input**: User description: "prepare evrything to make MCP for Login to OpenAi pluggin. Do all changes and final will be zip file with all details go!"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Connect a Paltrain account from OpenAI (Priority: P1)

A Paltrain user uses an OpenAI product that supports custom connectors (ChatGPT) and adds Paltrain as a connector. OpenAI sends the user to Paltrain's sign-in page. The user signs in with their existing Paltrain account, reviews what Paltrain will share with OpenAI, and approves. OpenAI then shows Paltrain as connected, and the user can use it from the chat.

**Why this priority**: Without a working sign-in, nothing else in this feature is reachable. It is the smallest slice that delivers value: a user who can connect their account.

**Independent Test**: From a clean OpenAI connector setup, add Paltrain, complete sign-in and consent, and confirm OpenAI shows Paltrain as connected and that the user's Paltrain display name appears in the connector settings.

**Acceptance Scenarios**:

1. **Given** a signed-out user adds Paltrain in OpenAI, **When** they start the connection, **Then** they are taken to Paltrain's sign-in page and not asked for their Paltrain password inside OpenAI.
2. **Given** the user signs in successfully, **When** the consent screen appears, **Then** it names Paltrain, OpenAI, and each kind of data that will be shared, and offers Approve and Cancel.
3. **Given** the user approves, **When** they return to OpenAI, **Then** the connector shows as connected.
4. **Given** the user cancels at consent, **When** they return to OpenAI, **Then** no connection is created and OpenAI shows that access was not granted.
5. **Given** a user is already signed in to Paltrain in the same browser, **When** they add the connector, **Then** the sign-in step is skipped and only consent is shown.

---

### User Story 2 - Ask Paltrain for a workout from the chat (Priority: P2)

A connected user asks OpenAI for a workout, for example "a 30-minute legs session for a tired day". OpenAI calls Paltrain on the user's behalf, and Paltrain returns the same kind of session plan the app produces for that mood, focus, and length. The user sees the exercises, their minutes, and any notice that the session is shorter than requested.

**Why this priority**: This is the reason to connect. It only works after Story 1.

**Independent Test**: With a connected account, ask for a session with a mood, a focus area, and a length. Confirm the returned exercises match the same request made in the Paltrain app, and that each exercise lists its name, minutes, and equipment.

**Acceptance Scenarios**:

1. **Given** a connected user, **When** they ask for a session with a mood, focus, and length, **Then** Paltrain returns a plan whose exercises match the app's plan for the same inputs.
2. **Given** a connected user asks for a focus area that does not exist, **When** the request is made, **Then** Paltrain returns a clear message listing the valid focus areas.
3. **Given** a connected user asks for a session shorter than the minimum, **When** the request is made, **Then** Paltrain returns the closest plan together with the notice the app shows.
4. **Given** a connected user browses the library, **When** they ask for the focus areas or exercises for one focus area, **Then** Paltrain returns the list without any personal information.

---

### User Story 3 - Disconnect and see what is shared (Priority: P3)

A user who no longer wants OpenAI to access Paltrain can disconnect it. Disconnecting ends OpenAI's access right away. The user can also see, in Paltrain, which connected apps have access and when each was approved.

**Why this priority**: Control and trust matter, and they are required before wider use, but the feature works for a first release without this screen.

**Independent Test**: Connect, confirm access works, then disconnect in Paltrain. Confirm the next request from OpenAI is refused and the connection no longer appears as active.

**Acceptance Scenarios**:

1. **Given** a connected user, **When** they disconnect OpenAI in Paltrain, **Then** the next request from OpenAI is refused and the connection shows as removed.
2. **Given** a user has more than one connected app, **When** they view their connections, **Then** each shows its name, the date it was approved, and its last use.
3. **Given** a user disconnects, **When** they reconnect later, **Then** they go through sign-in and consent again.

---

### Edge Cases

- What happens when a token expires during a conversation? OpenAI requests a new one using the stored approval, without asking the user again, until the approval itself is revoked.
- What happens when the user signs out of Paltrain but stays connected in OpenAI? The connection continues until the user disconnects it, since the approval is independent of the browser session.
- What happens when a request arrives with no token, an expired token, or a token that was revoked? Paltrain refuses it with a clear authorization error and returns no personal data.
- What happens when a token from one user is used to request another user's data? It is refused. A token only ever reaches the data of the user who approved it.
- What happens when OpenAI calls too often? Requests above a fixed per-user limit are refused for a short period with a retry message.
- What happens when a plan request has invalid input, such as an unknown mood? The request is refused with the same validation message the app would show, and nothing is saved.
- What happens when the user is not yet in Paltrain's user records? The first successful sign-in creates the record, as it does in the app today.
- What happens when Paltrain's exercise library is unavailable? Tools return a clear "temporarily unavailable" message instead of an empty plan.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Paltrain MUST expose its workout features to OpenAI as a connector that follows the Model Context Protocol (MCP) authorization standard.
- **FR-002**: Paltrain MUST authenticate the user through its existing sign-in provider. OpenAI MUST NEVER receive the user's Paltrain password.
- **FR-003**: Paltrain MUST show a consent screen before granting OpenAI access. The screen MUST name Paltrain, name OpenAI, and list the kinds of data shared.
- **FR-004**: Paltrain MUST issue access that is limited to a fixed set of read-only capabilities. In this release, OpenAI MUST NOT be able to change a user's data.
- **FR-005**: Each access token MUST expire within one hour. OpenAI MUST be able to renew access without asking the user again, until the user disconnects.
- **FR-006**: Paltrain MUST refuse every request that lacks a valid, unexpired, unrevoked token, with an error that does not reveal personal data.
- **FR-007**: A token MUST return only the data of the user who approved it.
- **FR-008**: Paltrain MUST let a user disconnect any connected app. Disconnecting MUST invalidate that app's access within one minute.
- **FR-009**: Paltrain MUST record, per connection, the approval time, the time of last use, and the granted capabilities, and show these to the user.
- **FR-010**: Paltrain MUST store no OpenAI-facing secret in plain text and MUST NOT log tokens or authorization codes.
- **FR-011**: Paltrain MUST use the same session-planning rules as the app, so the same inputs produce the same plan in both.
- **FR-012**: Paltrain MUST share with OpenAI only the user's display name and the content of the plan or library. Email address, sign-in identifier, and any mood history MUST NOT be shared.
- **FR-013**: Paltrain MUST limit requests per user to a fixed rate and refuse excess requests with a retry message.
- **FR-014**: Paltrain MUST provide a public description of the connector, including what it does, what data it reads, and how to disconnect, so the connector can be reviewed.
- **FR-015**: Paltrain MUST record an audit entry for each consent, token issue, refusal, and disconnect, without personal data beyond the user's internal account identifier.

### Key Entities

- **Connector Client**: The OpenAI application that asks for access. Attributes: name, the redirect addresses it may use, status.
- **Connection**: One approved link between a Paltrain user and a Connector Client. Attributes: approval time, last use, granted capabilities, status (active or removed).
- **Access Token**: A short-lived credential issued for one Connection. Attributes: expiry, status (active, expired, revoked).
- **Audit Entry**: A record of a consent, token issue, refusal, or disconnect. Attributes: time, event kind, internal user identifier, connector name.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new user can complete connect, sign in, and approve in under 2 minutes in a usability check with 10 participants, and at least 9 of them finish on the first attempt.
- **SC-002**: 100% of requests without a valid token are refused in a test of 50 unauthenticated and malformed requests.
- **SC-003**: 0 responses contain another user's data in a cross-user test of 20 token and account combinations.
- **SC-004**: After a user disconnects, the next request from OpenAI is refused within 1 minute in 100% of 20 trials.
- **SC-005**: A session plan requested through OpenAI matches the app's plan for the same mood, focus, and length in 100% of 30 comparison cases.
- **SC-006**: 0 email addresses, sign-in identifiers, or passwords appear in any response or log sample in a review of 100 samples.
- **SC-007**: Paltrain's connector description is complete (what it does, what it reads, how to disconnect) and passes a review against the MCP and OpenAI connector requirements before submission.

## Assumptions

- "Login to OpenAI plugin" means a ChatGPT custom connector built on MCP that signs users in with their Paltrain account. This is the current OpenAI route for third-party tools. It is not a legacy plugin manifest.
- Sign-in uses the Auth0 account system Paltrain already has. No second account system is created.
- The first release is read-only. Saving sessions, logging workouts, or changing mood history through OpenAI is out of scope and would need a new specification.
- The connector is served from the same Paltrain deployment, so the existing user records and exercise library are reused.
- Consent is required once per connection. Renewal uses the approval already given.
- Each access token lasts one hour, and approvals last until the user disconnects them.
- Users are English-speaking; the connector's messages follow the app's wording.
- Paltrain's medical and safety notices (shown in the app) are included in the plan text OpenAI receives, so the chat carries the same cautions as the app.
- Analytics on the connector is out of scope for this feature; the existing analytics feature covers the web app only.
