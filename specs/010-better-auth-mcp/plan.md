# Implementation Plan: Replace Auth0 with Better Auth, Keeping the ChatGPT Connector Working

**Branch**: `010-better-auth-mcp` (not created; this repo commits directly to `main`) | **Date**: 2026-11-09 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/010-better-auth-mcp/spec.md`

## Summary

Replace the Auth0 sign-in and token authority with Better Auth, running inside the Next.js app and storing its data in the existing Neon Postgres. Better Auth's MCP plugin provides the authorization server the ChatGPT connector needs: protected-resource metadata, dynamic client registration, PKCE, and access tokens bound to `https://www.pal-buddy.eu/mcp`. The existing MCP token verifier, connection checks, audit log, and rate limit stay in place; only their inputs (issuer, audience, keys) and the sign-in routes change. Test users are recreated, so no data migration is needed.

Research decisions are recorded in [research.md](research.md). Entities are in [data-model.md](data-model.md), interfaces in [contracts/connector-interface.md](contracts/connector-interface.md), and validation steps in [quickstart.md](quickstart.md).

## Technical Context

**Language/Version**: TypeScript on Node.js (Vercel default, Node 24 LTS), Next.js 16.4.3 with the App Router

**Primary Dependencies**: `better-auth`, `@better-auth/mcp`, `@better-auth/cimd` (new); `jose` 6.2.15 and `@modelcontextprotocol/server` (existing, kept); `drizzle-orm` and `drizzle-kit` (existing). `@auth0/nextjs-auth0` is removed.

**Storage**: PostgreSQL on Neon, accessed through Drizzle. Better Auth tables are generated into `src/lib/db/auth-schema.ts`.

**Testing**: Vitest (unit and integration, `npm test`), Playwright (end-to-end, `npm run test:e2e`). Integration tests need a reachable Postgres.

**Target Platform**: Vercel (Fluid Compute, Node runtime), production domain `https://www.pal-buddy.eu`.

**Project Type**: Web application: a Next.js app with a sign-in flow and an MCP endpoint, deployed as one project.

**Performance Goals**: Token verification needs no database round trip (JWKS check). The connection check and the rate limit each read the database once per MCP request, as they do today. Sign-in completes in under 2 minutes for a new user including consent (spec SC-001).

**Constraints**: Tokens expire after one hour (FR-009). Revoked connections are refused within one minute (FR-012). Only read-only scopes (FR-008). No Auth0 references remain after cutover (FR-018). Auth changes need a dedicated security review before release (FR-019).

**Scale/Scope**: Test phase with a small number of users. The existing per-user rate limit (FR-015) applies.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Checked against `.specify/memory/constitution.md` (version 1.0.0):

| Principle | Check | Result |
|-----------|-------|--------|
| I. Code Quality | New code keeps functions under 50 lines and nesting under 4. Secrets (`BETTER_AUTH_SECRET`, client secrets) come from environment variables, validated at startup by `src/lib/config/env.ts`. | Pass (enforced in tasks) |
| II. Testing Standards | Test-first for every change. The existing Auth0-based tests are rewritten first, so they fail, then pass. Coverage stays at or above 80% for changed code. The contract test in quickstart step 6 is an integration test. | Pass (enforced in tasks) |
| III. Maintainability | No new abstraction is added for the verifier: the existing one is reused (research Decision 2). Code stays organized by feature: `src/features/auth/`, `src/features/mcp/`, `src/lib/auth/`. | Pass |
| Quality gate: security review | Required because this changes authentication and authorization. Recorded in FR-019 and SC-009. | Pending until review |
| Quality gate: tests, lint, types, build | Must pass before merge. | Pending until implementation |

**Deliberate deviation recorded**: Anonymous dynamic client registration (research Decision 8). It is required for ChatGPT's connector flow, its scope is limited to read-only scopes, and it grants no access by itself. It is listed for the security review and is not a constitution violation.

**Post-design re-check**: No violations found after Phase 1. Gate status above is unchanged.

## Project Structure

### Documentation (this feature)

```text
specs/010-better-auth-mcp/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── connector-interface.md
├── checklists/
│   └── requirements.md  # Spec quality checklist (from /speckit-specify)
└── tasks.md             # Phase 2 output (/speckit-tasks; NOT created by /speckit-plan)
```

### Source Code (repository root)

Only the paths this feature touches are listed. Everything else stays as it is.

```text
src/
├── lib/
│   ├── auth/
│   │   ├── auth0.ts              # REMOVED (replaced by better-auth.ts)
│   │   ├── better-auth.ts        # NEW: server instance (email/password, jwt, mcp, cimd)
│   │   └── auth-client.ts        # NEW: browser client for sign-in and sign-out
│   ├── config/
│   │   └── env.ts                # CHANGED: AUTH0_* replaced by BETTER_AUTH_SECRET, BETTER_AUTH_URL
│   └── db/
│       ├── schema.ts             # CHANGED: re-exports the auth tables
│       └── auth-schema.ts        # NEW: generated by the Better Auth CLI
├── app/
│   ├── api/auth/[...all]/route.ts  # NEW: Better Auth catch-all handler
│   ├── mcp/route.ts              # CHANGED: JWKS and issuer from Better Auth config
│   ├── .well-known/oauth-protected-resource/mcp/route.ts   # CHANGED: authorization_servers
│   ├── (public)/sign-in/page.tsx # CHANGED: email and password form
│   ├── (public)/consent/page.tsx # NEW: consent screen for the connector
│   ├── (public)/privacy/page.tsx # CHANGED: names Better Auth instead of Auth0
│   ├── (public)/openai-connector/page.tsx  # CHANGED: names Better Auth instead of Auth0
│   └── (app)/layout.tsx          # CHANGED: uses the new session getter
├── features/
│   ├── auth/
│   │   ├── session.ts            # CHANGED: reads the session from Better Auth
│   │   └── user-repository.ts    # CHANGED: upserts by Better Auth user id
│   ├── mcp/
│   │   ├── mcp-config.ts         # CHANGED: issuer, resource, JWKS from BETTER_AUTH_URL
│   │   ├── token-verifier.ts     # UNCHANGED logic; settings come from mcp-config
│   │   ├── mcp-auth.ts           # UNCHANGED
│   │   ├── connection-check.ts   # UNCHANGED
│   │   └── disconnect.ts         # CHANGED: revokes the Better Auth consent
│   └── navigation/
│       └── app-nav-items.ts      # CHANGED: LOG_OUT_HREF points at the new sign-out route
└── middleware.ts                 # REMOVED (route-level checks replace it)

tests/
├── unit/
│   ├── mcp/mcp-config.test.ts    # CHANGED: new config inputs
│   ├── mcp/token-verifier.test.ts # CHANGED: Better Auth issuer and audience
│   └── config/env.test.ts        # CHANGED: new environment keys
├── integration/
│   ├── auth/require-session.test.ts  # CHANGED: Better Auth session
│   ├── mcp/mcp-route.test.ts     # CHANGED: tokens from Better Auth test keys
│   ├── mcp/metadata.test.ts      # CHANGED: authorization_servers value
│   └── mcp/token-contract.test.ts # NEW: quickstart step 6, a fresh client gets a token
└── e2e/
    └── helpers/sign-in.ts        # CHANGED: email and password sign-in
```

**Structure Decision**: Single Next.js project, organized by feature, as the constitution requires. Auth code is confined to `src/lib/auth/`, `src/features/auth/`, and `src/app/api/auth/`. MCP code stays in `src/features/mcp/`. No new top-level folders.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations. The only deliberate deviation (anonymous dynamic client registration) is recorded in the Constitution Check section and is not a constitution rule breach.
