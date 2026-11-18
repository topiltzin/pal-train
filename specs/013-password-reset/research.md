# Research: Password Reset for Users

No open NEEDS CLARIFICATION items remain in the spec. Three points in the spec conflict with what the platform does or with the spec's own privacy rule; each is resolved below and flagged for the user in the planning summary.

## Decision 1: Use Better Auth's built-in password reset

- **Decision**: Enable the reset flow Better Auth 1.7 already ships: `emailAndPassword.sendResetPassword`, `resetPasswordTokenExpiresIn: 3600` (60 minutes, spec FR-005), and `revokeSessionsOnPasswordReset: true` (spec FR-011). The client calls `authClient.requestPasswordReset({ email, redirectTo })` and `authClient.resetPassword({ newPassword, token })`.
- **Rationale**: Token generation, expiry, single use, and session revocation are security-sensitive. Better Auth already implements them and is the library the app uses for sign-in (spec 010). Writing them by hand would add risk for no gain (Constitution III: prefer well-maintained libraries).
- **Alternatives considered**: A custom token table and endpoints. Rejected: duplicates tested library behavior and increases the surface a security review must cover.
- **Source**: Better Auth v1.7.15 docs (`emailAndPassword` options; `request-password-reset` and `reset-password` endpoints).

## Decision 2: A newer link replaces older links (FR-006), enforced by the app

- **Decision**: Before a new reset is requested for an account, delete that account's existing reset tokens from the `verification` table. Better Auth stores each reset as a `verification` row with identifier `reset-password:<token>`, and it does not invalidate earlier rows when a new one is created.
- **Rationale**: Without this, two links from two requests would both work until they expire, which breaks FR-006.
- **Alternatives considered**: Accepting both links. Rejected: contradicts the spec.

## Decision 3: Per-account limit counted in an app table, not by Better Auth's rate limiter

- **Decision**: Record each accepted reset request in a new `password_reset_request` table (user id, requested-at). Before accepting a request, count the account's rows from the last 60 minutes. At 5 or more, do not send an email (FR-010). Also enable Better Auth's built-in `rateLimit` with `storage: "database"` on `/request-password-reset` as an IP-level backstop.
- **Rationale**: Better Auth's `customRules` apply per path and key on IP, not per account (checked in its docs), so they cannot enforce "5 per account per hour". Its default in-memory storage is per serverless instance and would not hold across requests, so `storage: "database"` is needed for the IP backstop to work.
- **Alternatives considered**: Counting rows in `verification`. Rejected: rows are deleted when a newer link replaces them (Decision 2), so the count would drop.

## Decision 4: Refused requests look the same as accepted ones (conflict with spec User Story 3, scenario 2)

- **Decision**: When the limit is reached, the response is the same generic confirmation as every other request, and no email is sent. The spec's wording ("refused with a message to try again later") is not used.
- **Rationale**: A limit message only for accounts that exist would reveal which addresses have accounts. That contradicts FR-003 and SC-002, which the spec also requires. Both cannot hold, so this plan keeps the privacy rule and changes the wording of User Story 3, scenario 2. **The user needs to confirm this change.**
- **Alternatives considered**: Show the limit message for everyone. Rejected: it would tell any visitor that a limit exists and force a wording change for every address.

## Decision 5: Atomic reset requires a transaction-capable database driver

- **Decision**: Switch the database client from the Neon HTTP driver (`drizzle-orm/neon-http`) to the Neon WebSocket driver with a connection pool (`drizzle-orm/neon-serverless`, same Neon database and connection string), and set `transaction: true` on the Drizzle adapter so a reset spends its token, revokes sessions, and saves the password together.
- **Rationale**: Better Auth documents that the Neon HTTP driver cannot run transactions. Without them, a failed reset can spend the link while the old password stays (spec FR-006 and the success path). This change touches the shared database client, so the existing database tests must pass and the sessions and plan routes must be re-checked.
- **Alternatives considered**: Keep the HTTP driver and accept the documented weakness. Rejected: a link could be lost on a failed reset, and the failure would be silent. It remains the fallback if the driver change is not approved.

## Decision 6: Email delivery through a transactional provider

- **Decision**: Use Resend (`resend/resend-email` in the Vercel Marketplace), with the API key in an environment variable validated at startup, as the constitution requires. Send from the reset handler with `waitUntil` from `@vercel/functions`, so the response does not wait for the send and the send is not cut off on serverless.
- **Rationale**: Better Auth's docs say to avoid awaiting the email send (timing attacks) and to use `waitUntil` on serverless. Resend is the messaging-category integration the marketplace search returned.
- **Alternatives considered**: Another provider (not yet compared). Recorded as an open choice; the code depends on a small sender interface, so the provider can change without touching the reset flow.

## Decision 7: Privacy-safe logging (FR-013)

- **Decision**: Log reset events with the account id and a truncated SHA-256 of the email, never the address itself.
- **Rationale**: FR-013 forbids plain-text addresses in logs; a hash still lets an operator correlate repeated requests.

## Decision 8: Reset pages follow the existing public-page pattern

- **Decision**: Add `(public)/forgot-password` and `(public)/reset-password` pages next to `(public)/sign-in`, with forms in `src/features/auth/` like `sign-in-form.tsx`. The sign-in form gets a "Forgot password?" link.
- **Rationale**: Reuses the existing layout, the show/hide password control, and the sign-in form's error handling.
