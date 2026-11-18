# Feature Specification: Password Reset for Users

**Feature Branch**: `013-password-reset` (not created; this repo commits directly to `main`)

**Created**: 2026-11-18

**Status**: Draft

**Input**: User description: "add the forget password functionality for users."

## Clarifications and Interpretation

- Spec 001 left password reset out of scope "unless added later". This feature is that addition.
- Sign-in stays email and password. Only accounts that use a password can reset one; there are no social sign-in accounts to handle.
- A reset is delivered by email, because the person cannot prove they own the account any other way. The app sends no email today, so delivery is part of this feature.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Reset a forgotten password (Priority: P1)

A person cannot remember their password. On the sign-in page they choose "Forgot password?", enter their email address, and receive an email with a link. The link opens a page where they set a new password. Afterwards they sign in with the new password.

**Why this priority**: This is the whole feature. Without it, a locked-out person has no way back into their account except by contacting someone.

**Independent Test**: Request a reset for a test account, follow the link from the email, set a new password, and sign in with it. The old password is refused and the new one works.

**Acceptance Scenarios**:

1. **Given** a person on the sign-in page, **When** they choose "Forgot password?" and enter the email address of an account, **Then** they see a confirmation that an email has been sent if the address belongs to an account.
2. **Given** a reset email, **When** the person opens the link and enters a new password that meets the sign-up password rules, **Then** the password is changed and they are told so.
3. **Given** a password was just changed, **When** the person signs in with the old password, **Then** sign-in is refused, and **when** they sign in with the new password, **Then** sign-in succeeds.

---

### User Story 2 - Handle an expired or used link (Priority: P2)

A person opens a reset link that is too old, has already been used, or was altered. They see a clear message that the link no longer works, with a way to request a new one. They are never shown a page that looks broken.

**Why this priority**: Links expire and get clicked twice, so this is common. It is needed for the feature to feel reliable, but the main path works without it.

**Independent Test**: Use a reset link twice, and use one after its time limit. Each time, the person sees the message and a "request a new link" option.

**Acceptance Scenarios**:

1. **Given** a reset link that has been used once, **When** the person opens it again, **Then** they see "This link has already been used" with an option to request a new one.
2. **Given** a reset link older than its time limit, **When** the person opens it, **Then** they see "This link has expired" with an option to request a new one.
3. **Given** a reset link that has been changed or is incomplete, **When** the person opens it, **Then** they see the same message as for an expired link, not an error page.

---

### User Story 3 - Protect accounts from misuse of reset (Priority: P3)

Someone who is not the account owner must not learn whether an email address has an account, must not be able to flood an account with reset emails, and must not keep access after the owner resets the password.

**Why this priority**: These protections matter for privacy and security, but the feature works for an honest user without them. They must be in place before the feature is released.

**Independent Test**: Request resets for an address with an account and for one without. The two responses look the same. Request more than the allowed number in an hour, and the extra requests are refused. Reset a password while signed in on another device, and that device is signed out.

**Acceptance Scenarios**:

1. **Given** an email address with no account, **When** someone requests a reset, **Then** they see the same confirmation as for an address with an account, and no email is sent.
2. **Given** an account that has requested resets several times in an hour, **When** another request arrives after the limit, **Then** it is refused with a message to try again later, and no further email is sent.
3. **Given** a person signed in on two devices, **When** they reset their password on one, **Then** the other device is signed out.

---

### Edge Cases

- What happens when the email arrives after a long delay? The link still works until its time limit, and the message in Story 2 covers the rest.
- What happens when a person requests a second reset before using the first? The newest link works. The earlier link is no longer valid.
- What happens when the new password is the same as the old one? It is refused with a clear message; the same rule as sign-up applies.
- What happens when the email cannot be delivered? The person still sees the confirmation (so the response does not reveal the account), the failure is recorded for the operator, and the person can request again after the limit window.
- What happens on a phone-width screen? Every reset page fits one column with a 16px side gutter, with no horizontal scrolling.
- What happens when a person uses the browser's Back button after changing the password? The form does not resubmit, and the sign-in page is shown.
- What happens when a reset link is opened while the person is signed in as a different account? The reset applies to the account the link was sent to, and the person is told which account it is for.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The sign-in page MUST offer a "Forgot password?" link.
- **FR-002**: A person MUST be able to request a reset by entering an email address on a dedicated page.
- **FR-003**: The reset request page MUST show the same confirmation whether or not an account exists for the address.
- **FR-004**: When an account exists, the system MUST send one email containing a single-use reset link.
- **FR-005**: A reset link MUST expire 60 minutes after it is sent.
- **FR-006**: A reset link MUST stop working after it has been used once, and when a newer link is requested for the same account.
- **FR-007**: The reset page MUST let the person set a new password that meets the same rules as the sign-up password.
- **FR-008**: After a successful reset, the person MUST be told it succeeded and MUST be able to sign in with the new password.
- **FR-009**: An expired, used, or invalid link MUST show a clear message and offer to request a new link. It MUST NOT show an error page.
- **FR-010**: No more than 5 reset requests per account are accepted in any rolling 60-minute window; further requests are refused with a message to try again later.
- **FR-011**: A successful reset MUST sign out every other active session for that account.
- **FR-012**: The reset email MUST contain only the reset link, a short explanation, and the expiry time. It MUST NOT contain the password, the account's stored details, or any other personal information.
- **FR-013**: Reset requests, completed resets, and refused requests MUST be recorded for the operator without storing the email address in plain text in the log.
- **FR-014**: All reset pages MUST be usable by keyboard, announce errors to screen readers, and fit a phone-width screen with no horizontal scrolling.
- **FR-015**: The reset flow MUST NOT change how sign-in works for accounts that have not reset their password.

### Key Entities

- **Account**: A person's sign-in identity, with an email address and a password. Already exists.
- **Reset request**: A single-use request for one account, with the time it was made and whether it has been used or replaced. Lives for at most 60 minutes after it is made.
- **Session**: A signed-in device or browser for an account. A successful reset ends every session for that account, so each device must sign in again.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A person who has forgotten their password can set a new one and sign in again in under 5 minutes, starting from the sign-in page.
- **SC-002**: In testing, 100% of reset requests for addresses with and without accounts receive the same on-screen confirmation.
- **SC-003**: Every reset link fails once it has been used, and every link fails after 60 minutes, in all tested cases.
- **SC-004**: In testing, a sixth reset request for one account within an hour is refused in 100% of cases.
- **SC-005**: After a successful reset, no other signed-in device for that account can still reach protected pages.
- **SC-006**: No reset email in testing contains a password or any personal detail beyond the link and expiry time.
- **SC-007**: All reset pages pass a keyboard-only walkthrough and show no horizontal scrolling at phone width.

## Assumptions

- Email is sent from the app through a transactional email provider. Choosing the provider is part of planning, not this spec.
- The sign-up password rules apply unchanged to the new password.
- A link is valid for 60 minutes and works once; a newer link for the same account replaces older ones.
- The request limit is 5 per account per rolling hour, counted from requests that were accepted.
- Accounts keep one sign-in method, email and password. Reset does not add a new sign-in method.
- The ChatGPT connector does not offer password reset. A person who forgets a password reset it in the web app.
- Existing signed-in sessions are not affected by the feature except when a reset ends them (FR-011).
- Reset emails are sent in the language of the app's existing pages.
