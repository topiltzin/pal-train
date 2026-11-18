# Implementation Plan: Password Reset for Users

**Branch**: `013-password-reset` (not created; this repo commits directly to `main`) | **Date**: 2026-11-18 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/013-password-reset/spec.md`

## Summary

Let a person who forgot their password request a reset from the sign-in page, receive a single-use link by email, set a new password, and have every other session signed out. The flow uses Better Auth's built-in reset (already the app's sign-in library), adds an email sender through a transactional provider, enforces the per-account limit and "newer link replaces older" rules in the app, and moves the database client to a driver that supports transactions so a failed reset cannot lose the link. Decisions are in [research.md](research.md); entities in [data-model.md](data-model.md); interfaces in [contracts/password-reset-interfaces.md](contracts/password-reset-interfaces.md); validation steps in [quickstart.md](quickstart.md).

## Decisions that change the spec

These need the user's confirmation before tasks are generated. Each is explained in research.md.

1. **Refused limit requests show the same confirmation** (research Decision 4). The spec's User Story 3, scenario 2 asks for a "try again later" message. A message shown only to existing accounts would reveal which addresses have accounts, which FR-003 forbids. The plan keeps FR-003 and sends no email when the limit is reached.
2. **Database driver change** (research Decision 5). Atomic reset needs transactions, which the current Neon HTTP driver does not support. The plan moves the shared database client to the Neon WebSocket driver. This touches every database feature, so it gets its own tasks and tests. The fallback is to keep the driver and accept that a failed reset can spend the link.

## Technical Context

**Language/Version**: TypeScript on Node.js (Vercel default), Next.js 16.4.3 App Router, React 19.3.0

**Primary Dependencies**: `better-auth` 1.7.18 (existing; built-in reset), `@neondatabase/serverless` (existing; driver changes to the WebSocket pool), `drizzle-orm` (existing), `@vercel/functions` (existing; `waitUntil`), `zod` (existing; environment validation). New: a transactional email client for Resend, added by the install step of the Vercel Marketplace integration.

**Storage**: One new table, `password_reset_request` (per-account request log for the limit). Better Auth's existing `verification` table holds the reset tokens.

**Testing**: Vitest for unit and integration (`npm test`, `npm run test:integration`); Playwright for end-to-end (`tests/e2e/`).

**Target Platform**: Vercel (Fluid Compute) for the app; browsers on phone and desktop widths.

**Project Type**: Web application: three public pages, a request-log table, an email sender, and Better Auth configuration.

**Performance Goals**: The reset request returns without waiting for the email to send (research Decision 6), so the response time does not depend on the provider.

**Constraints**: The response must be identical whether or not an account exists (spec FR-003, SC-002). Passwords and tokens must never be logged. The environment must be validated at startup (constitution, Principle I).

**Scale/Scope**: Password resets are rare events; the limit query reads at most a few rows per account per hour.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Checked against `.specify/memory/constitution.md` (version 1.0.0):

| Principle | Check | Result |
|-----------|-------|--------|
| I. Code Quality | Environment validated at startup with the existing `env.ts` pattern. Email body built by a pure function. Functions under 50 lines, nesting under 4 (checked in review). Named constants for the 60-minute window, the limit of five, and the token lifetime. No secrets in code; the provider key comes from the environment. | Pass (enforced in tasks) |
| II. Testing Standards | Test-first for the pure rules (limit count, email content, environment check), for the Better Auth configuration builder (extends the existing `better-auth-config.test.ts`), and for the pages end to end. The transaction change has its own test that a failed reset leaves the link usable. Coverage at or above 80% for changed `src/**/*.ts`. | Pass (enforced in tasks) |
| III. Maintainability | Built-in reset, not hand-rolled. The sender is an interface so the provider can change. The database driver change is isolated to the client module. | Pass |
| Quality gates | This feature changes authentication and user data, so **a dedicated security review is required before merge** (constitution, Quality Gates). The database client change also touches every feature and needs its existing tests to pass. | Requires security review |
| Development workflow | Research done first (Better Auth docs checked through Context7; rate-limit scope and transaction support checked against the installed driver). Tests before implementation. | Pass |

**Post-design re-check**: Adds one table, one sender, and three pages. The security review requirement stands. Two decisions need the user's confirmation (above) before tasks are generated.

## Project Structure

### Documentation (this feature)

```text
specs/013-password-reset/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── password-reset-interfaces.md
├── checklists/
│   └── requirements.md
└── tasks.md   # Phase 2 output (/speckit-tasks; NOT created by /speckit-plan)
```

### Source Code (repository root)

Only the paths this feature touches are listed.

```text
src/
├── app/
│   └── (public)/
│       ├── forgot-password/page.tsx      # NEW: request form page
│       └── reset-password/page.tsx       # NEW: new-password form page (reads token from the URL)
├── features/
│   └── auth/
│       ├── sign-in-form.tsx              # CHANGED: adds the "Forgot password?" link
│       ├── forgot-password-form.tsx      # NEW: email field, generic confirmation
│       ├── reset-password-form.tsx       # NEW: new password, invalid-link message
│       ├── password-reset-email.ts       # NEW: pure email builder (subject, body, expiry text, no personal data)
│       ├── password-reset-sender.ts      # NEW: sender interface and the Resend implementation
│       ├── password-reset-limit.ts       # NEW: pure rule: count in window, decide accept or refuse
│       ├── password-reset-requests.ts    # NEW: repository for password_reset_request (count, record, prune)
│       └── password-reset-log.ts         # NEW: privacy-safe event log (hashed email, never the address)
├── lib/
│   ├── auth/
│   │   ├── auth-options.ts               # CHANGED: emailAndPassword reset options; rateLimit storage: database
│   │   └── better-auth.ts                # CHANGED: wires sendResetPassword, the limit, and the transaction flag
│   ├── config/
│   │   └── env.ts                        # CHANGED: RESEND_API_KEY and PASSWORD_RESET_FROM validated at startup
│   └── db/
│       ├── client.ts                     # CHANGED: Neon WebSocket pool driver (transactions; research Decision 5)
│       ├── schema.ts                     # CHANGED: adds password_reset_request
│       └── migrations/                   # NEW: generated migration for password_reset_request
tests/
├── unit/
│   ├── auth/
│   │   ├── better-auth-config.test.ts    # CHANGED: reset options, revokeSessionsOnPasswordReset, rate limit storage
│   │   ├── password-reset-limit.test.ts  # NEW
│   │   ├── password-reset-email.test.ts  # NEW: body has the link and expiry, no password or stored details
│   │   └── env.test.ts                   # CHANGED: the two new variables
├── integration/
│   └── auth/
│       ├── password-reset-flow.test.ts   # NEW: request, replace, limit, use, revoke, failed save keeps the link
│       └── database-transactions.test.ts # NEW: the client runs a transaction and rolls it back on error
└── e2e/
    └── password-reset.spec.ts            # NEW: sign-in link to confirmation; reset with a test sender
```

**Structure Decision**: Feature code lives in `src/features/auth/` beside sign-in and session code. Configuration stays in `src/lib/auth/`, where the Better Auth options already are. The database client change is confined to `src/lib/db/client.ts`. Pages follow the existing `(public)` routes.

## Phased Plan

1. **Foundation**: environment validation, the new table and its migration, and the transaction-capable client (with its own test). Nothing user-visible yet.
2. **Core reset (User Story 1)**: Better Auth reset options, the sender and email builder, the request and reset pages, and the sign-in link.
3. **Failure and replacement (User Story 2)**: invalid, expired, and used link messages; replacing older links on a new request.
4. **Protection (User Story 3)**: the per-account limit, the IP backstop, session revocation, and the privacy-safe log.
5. **Polish**: security review, accessibility and phone-width checks, quickstart walkthrough.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Driver change for the whole database client (Decision 5) | Atomic reset needs transactions, which the HTTP driver does not provide | Keeping the HTTP driver can spend a link on a failed reset; the spec's single-use rule and reliability both depend on the transaction |
