# Contract: Password Reset Interfaces

Three things users and other systems touch: the web pages, the Better Auth endpoints the pages call, and the reset email. Endpoints are Better Auth's; the app adds rules around them, not new routes of its own.

## 1. Web pages

| Path | Who | Purpose |
|------|-----|---------|
| `/sign-in` | Everyone | Existing page. Gains a "Forgot password?" link to `/forgot-password` (spec FR-001). |
| `/forgot-password` | Signed-out visitors | Enter an email address (spec FR-002). |
| `/reset-password?token=...` | Visitors with an emailed link | Enter a new password (spec FR-007). |

Behavior:

- `/forgot-password` always shows the same confirmation after a submit: "If an account exists for that address, we've sent a link to reset the password." It is shown for every syntactically valid address, with or without an account (spec FR-003, SC-002).
- `/reset-password` reads `token` from the URL. Better Auth redirects here with `?error=INVALID_TOKEN` when the link is expired, used, replaced, or altered (spec FR-009). The page then shows "This link is no longer valid." with a link to `/forgot-password`. It shows no error page.
- On success the page shows "Your password has been changed. Sign in with your new password." with a link to `/sign-in` (spec FR-008).
- Every page is keyboard-operable, announces errors through a live region, and uses the existing single-column layout (spec FR-014).

## 2. Better Auth endpoints used

| Call | Request | Success | Notes |
|------|---------|---------|-------|
| `authClient.requestPasswordReset` | `{ email, redirectTo: "<origin>/reset-password" }` | Always a success response when the request is well formed | Better Auth does not reveal whether the account exists. The app's rule (limit, replace older links) runs before the email is sent, inside the `sendResetPassword` path. |
| `authClient.resetPassword` | `{ newPassword, token }` | Success, or an error code when the token is invalid, expired, or used | On success every session for the account is revoked (spec FR-011). |

## 3. Reset email

Sent through the transactional provider (Decision 6). Content is limited to what spec FR-012 allows.

| Part | Content |
|------|---------|
| Subject | Reset your Pal Buddy password |
| Body | One sentence: someone asked to reset the password for this account. A button or link to `<reset url>`. One sentence: the link works for 60 minutes and once. One sentence: if this was not you, ignore this email. |
| Not included | The password, the account's stored details, the account's id, or any other personal information. The link is the only personal-looking value. |
| From | The configured sender address from the environment (`PASSWORD_RESET_FROM`) |

## 4. Internal rules

- **Limit**: at most 5 accepted requests per account in any 60-minute window (spec FR-010). A refused request writes no row and sends no email, and the response is the same as an accepted one (Decision 4).
- **Replacement**: a newly accepted request deletes the account's earlier reset tokens (Decision 2).
- **Log line** (spec FR-013): `password reset requested` / `password reset completed` / `password reset refused`, with the account id and a truncated SHA-256 of the email. Never the address.
