# Implementation Plan: OpenAI MCP Sign-In for Paltrain

**Branch**: `008-openai-mcp-login` | **Date**: 2026-11-07 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/008-openai-mcp-login/spec.md`

## Summary

Make Paltrain available to ChatGPT as a custom connector built on the Model Context Protocol (MCP). Users sign in with their existing Paltrain account through Auth0, approve access, and then ask for workouts from the chat. Paltrain serves three read-only MCP tools (focus areas, exercises for a focus, and session plans) from the same deployment, reusing the app's planning function so results match the app. Auth0 issues the tokens; Paltrain verifies them and checks its own connection record on every request, so a disconnect takes effect at once. Two dependencies are added: the MCP server SDK and `jose` for token verification. Research item 7 (the consent screen) is a spike that must close before User Story 1's tasks.

## Technical Context

**Language/Version**: TypeScript 5 on Node.js (Vercel Fluid Compute default runtime), Next.js 16.4.3 App Router

**Primary Dependencies**: `@modelcontextprotocol/server` (pinned at implementation time, v2 split packages per the SDK docs), `jose` (pinned). Existing: `@auth0/nextjs-auth0`, `drizzle-orm`, `zod`.

**Storage**: Existing Neon Postgres via Drizzle. Three new tables: connections, audit entries, rate windows (see `data-model.md`). Migration through `drizzle-kit`.

**Testing**: Vitest for unit and integration (`tests/unit`, `tests/integration`), Playwright for end-to-end (`tests/e2e`). Coverage target 80%.

**Target Platform**: Vercel serverless (Node.js runtime) for the MCP endpoint, the metadata routes, and the connections page.

**Project Type**: Web application with an MCP resource server (same deployment).

**Performance Goals**: Token verification and connection check add a small, bounded cost per request. A plan request returns in the same time as the app's session-plan API.

**Constraints**: Read-only in this release (FR-004). Tokens expire within one hour (FR-005). No email, sign-in identifier, or mood history leaves Paltrain (FR-012). Tokens and authorization codes are never logged (FR-010). Requests per user are rate-limited (FR-013).

**Scale/Scope**: One connector, three tools, one connections page, three new tables. Expected load is small and bounded by user count.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle / Gate | Status | How this plan complies |
|------------------|--------|------------------------|
| I. Code quality: names, under 50 lines, early returns, explicit errors | PASS | Each unit is small and named. Verifier errors map to explicit HTTP responses. |
| I. No secrets in source; required secrets validated at startup | PASS | No new secrets. Auth0 values come from existing validated environment (`src/lib/config/env.ts`). The resource identifier is derived from `APP_BASE_URL`. |
| I. Validate input at the boundary | PASS | Tool inputs are validated with `zod` before use (`contracts/mcp-tools.md`). |
| I. No mutation of incoming data; no debug output | PASS | Pure functions return new values. No `console.log` in the feature. Tokens are never logged. |
| II. Test-first, 80% coverage, AAA tests, deterministic | PASS | Unit tests for verifier, connection check, rate limit, and tools. Integration tests sign test tokens with a local key and use the real route handler. No real network in unit tests. |
| II. Three test levels | PASS | Unit (verifier, rate limit, tools, metadata shape). Integration (route plus database, bearer checks, disconnect). End-to-end (connections page and disconnect). |
| III. Feature-organized folders | PASS | All logic in `src/features/mcp/`. Routes stay thin in `src/app/`. |
| III. Repository pattern for storage | PASS | Connection, audit, and rate-window access go through repository interfaces, with a Drizzle implementation. Tools depend on the interface. |
| III. No speculative abstraction | PASS | No generic OAuth framework. One verifier, one connection check, one rate limiter. |
| III. New dependency must be justified | PASS | `@modelcontextprotocol/server`: the protocol and bearer gate the spec requires; hand-rolling MCP is not reasonable. `jose`: well-maintained JWT and JWKS handling; hand-rolled crypto is not acceptable. |
| Quality gate: dedicated security review | REQUIRED | Auth, user data, and an external integration are touched. Security review before merge. |
| Quality gate: OpenAI connector review (FR-014, SC-007) | REQUIRED | The connector description and policy text are reviewed before submission. |
| Blocking open item: consent mechanism (research §7) | OPEN | Spike must resolve before User Story 1 tasks. Not a planning blocker. |

**Result**: No violations. All gates pass or are scheduled. Two open items are recorded (research §2 and §7). Research §7 blocks User Story 1 tasks only.

## Project Structure

### Documentation (this feature)

```text
specs/008-openai-mcp-login/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   ├── mcp-tools.md     # The three tools: names, inputs, outputs, errors
│   └── http-endpoints.md# /mcp, metadata routes, challenges, connections page, disconnect
├── checklists/
│   └── requirements.md
└── tasks.md             # Created by /speckit-tasks, not by this command
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── mcp/route.ts                                  # MCP endpoint behind the bearer gate
│   ├── .well-known/oauth-protected-resource/mcp/route.ts  # RFC 9728 metadata (path-aware)
│   └── (app)/connections/page.tsx                    # View and disconnect connected apps
├── features/mcp/
│   ├── mcp-config.ts            # Resource identifier and issuer, derived from existing env
│   ├── token-verifier.ts        # jose: JWKS, signature, issuer, audience, expiry, scopes
│   ├── connection-check.ts      # Refuses requests whose connection is removed
│   ├── connection-repository.ts # Interface plus Drizzle implementation
│   ├── audit-log.ts             # Records consent, token use, refusal, disconnect
│   ├── rate-limit.ts            # Per-user, per-minute window
│   ├── tools.ts                 # list_focus_areas, list_exercises, plan_session
│   ├── server.ts                # Builds the MCP server with the three tools
│   └── disconnect.ts            # Marks a connection removed
└── lib/db/schema.ts             # Adds three tables

drizzle/                         # New migration for the three tables

tests/
├── unit/mcp/
│   ├── token-verifier.test.ts
│   ├── connection-check.test.ts
│   ├── rate-limit.test.ts
│   ├── tools.test.ts
│   └── mcp-config.test.ts
├── integration/mcp/
│   ├── mcp-route.test.ts        # Real route handler, signed test tokens, real repository
│   └── disconnect.test.ts
└── e2e/
    └── mcp-connections.spec.ts  # Connections page and disconnect in a signed-in session
```

**Structure Decision**: One feature folder with small files, each with a single responsibility. Routes and pages are thin wrappers, which matches the existing app layout (`src/features/*`). The three new tables go in the existing `schema.ts`, consistent with the existing tables.

## Complexity Tracking

Two dependencies are added, both justified in the Constitution Check. No other violation to justify. The connection check is one extra database read per MCP request; it is the simplest way to meet FR-008 and SC-004 without depending on Auth0 revocation (research §6).
