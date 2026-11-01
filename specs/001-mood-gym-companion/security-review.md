# Security Review: Auth and Session Code

**Feature**: [spec.md](./spec.md) | **Date**: 2026-11-01 | **Scope**: sign-in, session helpers, middleware, and every `/api` route

**Method**: Inline review of the source by reading the code and grepping for the patterns below. The
dedicated security-reviewer agent was not run in this pass.

## Scope reviewed

- `src/middleware.ts`, `src/lib/auth/auth0.ts`: Auth0 SDK wiring
- `src/features/auth/session.ts`, `src/features/auth/me.ts`, `src/features/auth/user-repository.ts`
- Every route under `src/app/api/` and its handler under `src/features/`
- `src/lib/api/errors.ts`, `src/lib/api/route-error.ts`, `src/lib/api/envelope.ts`
- `.gitignore`, and a search of `src/` for hard-coded secrets and raw HTML rendering

## Checks and results

| # | Check | Result | Evidence |
|---|-------|--------|----------|
| 1 | Every API endpoint requires a session | PASS | `requireUser` is called in `me.ts`, `handle-moods.ts`, `handle-focus-areas.ts`, `handle-suggestions.ts` (covers `/api/suggestions` and `/api/suggestions/next`), and `handle-templates.ts` (covers `/api/templates` and `/api/templates/{id}`). Integration tests assert `401 UNAUTHENTICATED` when signed out. |
| 2 | Middleware covers app routes | PASS | `src/middleware.ts` matches every path except static assets. It mounts the Auth0 SDK routes. Authorization is enforced in handlers, not only in middleware. |
| 3 | Input validation at the boundary | PASS | Request bodies and query strings go through zod before use (`handle-suggestions.ts`, `handle-templates.ts`). Unknown mood, focus, intensity, and out-of-range numbers return `400`. |
| 4 | Error details do not reach clients | PASS | `errorResponse` replaces `INTERNAL` messages with a generic string. The only raw `error.message` values come from our own safe errors (`UnauthenticatedError`, `LibraryUnavailableError`). Details go to `console.error`. |
| 5 | Secrets not in source | PASS | `.gitignore` ignores `.env*` and `.vercel`. A search for key-shaped literals in `src/` found none. Env values are read through `src/lib/config/env.ts`, which fails fast when they are missing. |
| 6 | XSS | PASS | No `dangerouslySetInnerHTML` in `src/`. User-visible text is rendered as React text. |
| 7 | Identity mapping | PASS | `users.id` is the Auth0 `sub`, which is immutable. User rows are upserted from session claims, so one account cannot take over another's row. |
| 8 | Rate limiting on all endpoints (`security.md`) | **OPEN, HIGH** | No rate limiting exists in `src/`. See finding F1. |
| 9 | CSRF on state-changing POSTs | PASS (fixed, see F2) | `POST /api/suggestions` and `/next` read the body as JSON without checking `Content-Type`. |

## Findings

### F1: No rate limiting (HIGH, open)

- **What**: The project rule `security.md` requires rate limiting on all endpoints. None of the
  `/api` routes, nor the sign-in path, is rate limited.
- **Impact**: An authenticated or scripted client can send unlimited suggestion requests. Each
  request writes to `suggestion_state`. The sign-in path is also unthrottled at the app level.
- **Why not fixed here**: The rate-limit mechanism is a provider decision (Vercel Firewall rules,
  BotID, or a Marketplace store such as Upstash for per-user counters). It needs a choice and an
  integration, so it is not a silent code change.
- **Recommendation**: Provision a rate-limit path through the Vercel Marketplace, then add a
  per-user limit on `POST /api/suggestions` and `POST /api/suggestions/next` and a per-IP limit on
  `/auth/login`. Re-run this review afterwards.

### F2: JSON body accepted without a content-type check (LOW, fixed)

- **What**: `readJsonBody` in `handle-suggestions.ts` parses the body regardless of `Content-Type`.
- **Impact**: A cross-site form can post `text/plain` JSON to `/api/suggestions`. The response
  cannot be read cross-origin, and the only write is `last_template_id`. The Auth0 session cookie
  is also a same-site-restricted cookie by default, which limits this further.
- **Fix applied**: requests whose `Content-Type` is not `application/json` now get
  `400 INVALID_INPUT`, covered by an integration test.

## Summary

- CRITICAL: none found.
- HIGH: one, F1 (rate limiting), **open**. Needs the provider decision above before it can close.
- MEDIUM: none.
- LOW: one, F2, fixed: non-JSON requests get `400 INVALID_INPUT`.

The auth and session code paths are covered by integration tests, except `src/lib/auth/auth0.ts`
(SDK wiring, 0% covered), which is verified by the signed-out e2e redirect only. Signed-in e2e
flows need `E2E_USER_EMAIL` and `E2E_USER_PASSWORD` set for an Auth0 dev-tenant test user.
