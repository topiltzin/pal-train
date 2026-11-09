# Feature Specification: Replace Auth0 with Better Auth, Keeping the ChatGPT Connector Working

**Feature Branch**: `010-better-auth-mcp` (not created; this repo commits directly to `main`)

**Created**: 2026-11-09

**Status**: Draft

**Input**: User description: "replace Auth0 with Better Auth, the old users do not matter, they are test ones. Focus on this, and on compatibility with MCP."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Connect Pal Buddy to ChatGPT with Pal Buddy sign-in (Priority: P1)

A Pal Buddy user adds Pal Buddy as a ChatGPT connector. ChatGPT registers itself with Pal Buddy automatically, sends the user to the Pal Buddy sign-in page, and then to a consent screen. After the user approves, ChatGPT shows Pal Buddy as connected and can request workout plans.

**Why this priority**: Without this, the connector cannot be used at all. It is the reason for the change, and it is what the current Auth0 setup fails to do.

**Independent Test**: From a clean ChatGPT connector setup, add Pal Buddy, sign in with a test account, approve consent, and confirm ChatGPT shows Pal Buddy as connected and returns a workout plan for a simple request.

**Acceptance Scenarios**:

1. **Given** a signed-out user adds Pal Buddy in ChatGPT, **When** they start the connection, **Then** ChatGPT registers itself without the user entering any client details, and the user is sent to the Pal Buddy sign-in page.
2. **Given** the user signs in successfully, **When** the consent screen appears, **Then** it names Pal Buddy and ChatGPT and lists each kind of data that will be shared, with Approve and Cancel.
3. **Given** the user approves, **When** they return to ChatGPT, **Then** the connector shows as connected and a workout request succeeds.
4. **Given** the user cancels at consent, **When** they return to ChatGPT, **Then** no connection is created and ChatGPT reports that access was not granted.
5. **Given** the user is already signed in to Pal Buddy in the same browser, **When** they add the connector, **Then** the sign-in step is skipped and only consent is shown.

---

### User Story 2 - Sign in to the Pal Buddy web app (Priority: P2)

A Pal Buddy user signs in to the web app, uses the app, and signs out. Existing app features keep working with the same account.

**Why this priority**: The web app must keep working after Auth0 is removed. It uses the same sign-in as the connector, so it is delivered together with User Story 1 but is useful on its own.

**Independent Test**: Sign in to the web app with a test account, open a protected page, sign out, and confirm the protected page is no longer available.

**Acceptance Scenarios**:

1. **Given** a signed-out visitor opens a protected page, **When** they request it, **Then** they are sent to the sign-in page and returned to the page after signing in.
2. **Given** a signed-in user, **When** they sign out, **Then** their web session ends and protected pages redirect them to sign in again.
3. **Given** a test user signs in for the first time, **When** sign-in completes, **Then** a Pal Buddy user record is created, as it is today.

---

### User Story 3 - Disconnect the connector and see connected apps (Priority: P3)

A user who no longer wants ChatGPT to access Pal Buddy disconnects it in Pal Buddy. Disconnecting ends access right away, and the user can see which apps are connected and when each was approved and last used.

**Why this priority**: Control over access is required before wider use, but the connector can be tested before this screen is complete.

**Independent Test**: Connect the connector, confirm access works, disconnect it in Pal Buddy, and confirm the next request from ChatGPT is refused.

**Acceptance Scenarios**:

1. **Given** a connected user, **When** they disconnect ChatGPT in Pal Buddy, **Then** the next request from ChatGPT is refused and the connection shows as removed.
2. **Given** a user has more than one connected app, **When** they view their connections, **Then** each shows its name, the date it was approved, and its last use.
3. **Given** a user disconnected ChatGPT, **When** they reconnect later, **Then** they go through sign-in and consent again.

---

### Edge Cases

- What happens when a token is for a different resource (not Pal Buddy's MCP endpoint)? The request is refused. A token is accepted only when its audience is Pal Buddy's MCP endpoint.
- What happens when ChatGPT requests the connector without signing in? The request is refused with a clear sign-in challenge that points to Pal Buddy's protected-resource description. No personal data is returned.
- What happens when a token expires during a conversation? ChatGPT renews access without asking the user again, until the user disconnects.
- What happens when the sign-in service is unavailable or failing? Sign-in and connector requests show a clear "temporarily unavailable" message. Requests without a valid token are still refused; no request is accepted on a guess.
- What happens when an unknown app registers itself and asks for access? The app can register, but it receives access only after a signed-in user approves it. Access is limited to the read-only scopes.
- What happens when a user signs out of Pal Buddy but stays connected in ChatGPT? The connection continues until the user disconnects it, since the approval is independent of the web session.
- What happens to users created under Auth0? They are not carried over. This is a test system; test accounts are created again in the new sign-in.
- What happens when ChatGPT has cached an old connector configuration? The user is asked to remove and re-add the connector. The old configuration is not accepted after the change.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The web app's sign-in, session, and sign-out MUST be handled by Better Auth, running inside Pal Buddy and storing its data in Pal Buddy's existing database. Auth0 MUST be removed from the sign-in path.
- **FR-002**: The connector MUST follow the Model Context Protocol (MCP) authorization standard: it MUST publish protected-resource metadata that names the authorization server and the resource, and MUST answer unauthenticated requests with a challenge that points to that metadata.
- **FR-003**: The authorization server MUST let ChatGPT register itself automatically (dynamic client registration), so that the user never types a client ID or secret. Registration MUST NOT grant any access by itself.
- **FR-004**: The authorization flow MUST use PKCE with the S256 method for every client.
- **FR-005**: The authorization request MUST accept the resource indicator for the MCP endpoint. Tokens MUST carry that resource as their audience, and Pal Buddy MUST accept only tokens with that audience.
- **FR-006**: Users MUST sign in on Pal Buddy's own sign-in page. ChatGPT MUST NEVER receive a user's password.
- **FR-007**: A consent screen MUST appear before ChatGPT is granted access. It MUST name Pal Buddy and ChatGPT and list each kind of data shared.
- **FR-008**: Access MUST be limited to the read-only scopes `plans:read` and `library:read`. In this release, ChatGPT MUST NOT be able to change a user's data.
- **FR-009**: Each access token MUST expire within one hour. Access MUST be renewable without asking the user again, until the user disconnects.
- **FR-010**: Pal Buddy MUST refuse every request that lacks a valid, unexpired token with the correct audience, with an error that reveals no personal data.
- **FR-011**: A token MUST return only the data of the user who approved it.
- **FR-012**: A user MUST be able to disconnect any connected app, and access MUST end within one minute of disconnecting.
- **FR-013**: Pal Buddy MUST record, per connection, the approval time, the last use time, and the granted scopes, and show them to the user.
- **FR-014**: Pal Buddy MUST share with ChatGPT only the user's display name and the content of the plan or library. Email address, the sign-in identifier, and mood history MUST NOT be shared.
- **FR-015**: Pal Buddy MUST limit requests per user to a fixed rate and refuse excess requests with a retry message.
- **FR-016**: Tokens, authorization codes, client secrets, and session secrets MUST NOT appear in logs or responses.
- **FR-017**: Pal Buddy MUST publish a public connector description that names what it does, what data it reads, and how to disconnect, so the connector can be reviewed.
- **FR-018**: Auth0 MUST NOT be used for any sign-in, token issue, or token check after the change. Its settings and clients MUST be removed or disabled as part of the change.
- **FR-019**: The change touches authentication and authorization, so it MUST receive a dedicated security review before release. Any CRITICAL or HIGH finding MUST be fixed before merge, as the project constitution requires.

### Key Entities *(include if feature involves data)*

- **Pal Buddy User**: A person who signs in. Attributes: an internal user identifier, display name. The identifier is issued by Pal Buddy's sign-in and is not shared with ChatGPT.
- **Connector Client**: The ChatGPT application that registers itself. Attributes: name, redirect addresses, status.
- **Connection**: One approved link between a Pal Buddy user and a Connector Client. Attributes: approval time, last use, granted scopes, status (active or removed).
- **Access Token**: A short-lived credential issued for one Connection. Attributes: audience (the MCP endpoint), expiry, status (active, expired, revoked).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new test user can connect Pal Buddy from ChatGPT, sign in, and approve consent in under 2 minutes, and at least 9 of 10 finish on the first attempt.
- **SC-002**: 100% of requests without a valid, unexpired token for the Pal Buddy endpoint are refused in a test of 50 unauthenticated and malformed requests.
- **SC-003**: 100% of tokens issued for a different resource are refused by the Pal Buddy endpoint in a test of 20 such tokens.
- **SC-004**: After a user disconnects ChatGPT, the next request is refused within 1 minute in 100% of 20 trials.
- **SC-005**: The connector is accepted by ChatGPT's custom connector setup without any manual client registration, in 100% of 5 fresh setups.
- **SC-006**: Every test user can sign in to the web app and sign out, in 100% of 20 test runs.
- **SC-007**: No email address, sign-in identifier, password, or token appears in any connector response or log sample in a review of 100 samples.
- **SC-008**: The public connector description covers what it does, what it reads, and how to disconnect, and it passes the MCP and OpenAI connector review checks before submission.
- **SC-009**: The security review under FR-019 is complete, with no open CRITICAL or HIGH findings, before the connector is switched on for users.

## Assumptions

- The replacement is Better Auth, an open-source authentication library that runs inside Pal Buddy. It stores its data in the existing database, so no separate vendor account, plan, or user limit applies.
- Pal Buddy's sign-in, consent, and token issuing are built and operated by Pal Buddy. Because of this, FR-019 applies in full.
- All existing accounts are test data. Users created under Auth0 are not migrated; test users are created again.
- The Auth0 tenant is not used after cutover. It is not deleted as part of this feature unless the owner asks for it.
- The session-plan rules, exercise library, and MCP tools (`list_focus_areas`, `list_exercises`, `plan_session`) stay as they are. Only the sign-in and authorization layer changes.
- The first release stays read-only, as in feature 008.
- Connector access is served from the same deployment at `https://www.pal-buddy.eu/mcp`, and the web app at `https://www.pal-buddy.eu`.
- Users are English-speaking; the connector's messages follow the app's wording. The sign-in and consent pages reuse the app's existing look.
- Medical and safety notices in the app are included in the plan text that ChatGPT receives.
- MCP specification status: the connector is designed for dynamic client registration. If the current MCP specification requires a different registration method, that method is added without changing the user-facing steps.
