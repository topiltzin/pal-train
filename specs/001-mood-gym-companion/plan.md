# Implementation Plan: Mood-Based Gym Companion

**Branch**: `001-mood-gym-companion` | **Date**: 2026-10-31 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-mood-gym-companion/spec.md`

## Summary

A signed-in, mood-driven web page where a gym-goer picks how they feel and/or what they want to
train, and gets one to three workout ideas from a library of at least 100 templates. The page acts as
a friendly buddy, not a coach: it suggests, never prescribes. Sign-in is required.

Technical approach: a server-rendered Next.js App Router application on Vercel. Route handlers serve
a small JSON API. The template library ships as versioned content in the repository, validated at
build and seeded for runtime reads. Users, sign-in, and per-user suggestion state live in a Neon
Postgres database and an Auth0 tenant, both provisioned through the Vercel Marketplace. Research
decisions are recorded in [research.md](./research.md).

## Technical Context

**Language/Version**: TypeScript 5.x on Node.js 24 LTS (Vercel default)

**Primary Dependencies**: Next.js 16 (App Router, React Server Components, route handlers),
React, Tailwind CSS (playful visual system), Auth0 Next.js SDK (sign-in), a schema validator for
boundary input (zod), and a typed Postgres query layer (Drizzle ORM)

**Storage**: Neon Postgres (Vercel Marketplace). Tables: `users`, `suggestion_state`. Workout
templates are repository content, not a database table, in version 1.

**Testing**: Vitest (unit and integration), Playwright (end-to-end). Coverage via Vitest's V8
coverage provider, threshold 80%.

**Target Platform**: Web, responsive from phone width (320 px) to desktop. Evergreen browsers.

**Project Type**: Web application (single Next.js project with API route handlers)

**Performance Goals**: First suggestion visible within 15 seconds of landing on the page for a
signed-in user (SC-001). Suggestion requests return within 500 ms at the 95th percentile.

**Constraints**: No health data stored (FR-012). Sign-in required before any workout content
(FR-012). Playful visuals must not break phone layout or accessibility (FR-013, SC-006). Secrets
from environment variables only (constitution I).

**Scale/Scope**: Initial audience in the low thousands of users. 100 to 150 templates across 8 focus
areas, at least 8 per area (FR-005). Eight moods (FR-001).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Result |
|-----------|-------|--------|
| I. Code Quality | Functions under 50 lines, nesting at most 4, boundary validation with zod, secrets from env validated at startup, named constants for limits | PASS (enforced in tasks and review) |
| II. Testing Standards | Test-first, 80% coverage, unit/integration/e2e levels, deterministic tests, mocks reflect real behavior | PASS (test tasks precede implementation tasks) |
| III. Maintainability | Organized by feature, storage behind a repository interface, no speculative abstractions, files under 400 lines target | PASS |
| Quality Gates | Auth changes trigger the mandatory security review (Auth0 integration, session handling, user data) | PASS, with a required review step before merge |
| Development Workflow | Research first (done in research.md), tests before code, Conventional Commits | PASS |

**Gate result**: PASS. No unjustified violations, so Complexity Tracking stays empty. Two extra
services (Neon, Auth0) are justified in research.md, because sign-in is a requirement and the
marketplace skill directs real provisioned integrations over mocks.

## Project Structure

### Documentation (this feature)

```text
specs/001-mood-gym-companion/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── api.md           # Phase 1 output (HTTP JSON contract)
├── checklists/
│   └── requirements.md  # From /speckit-specify
└── tasks.md             # Phase 2 output (/speckit-tasks, not created here)
```

### Source Code (repository root)

```text
app/                          # Next.js App Router (routes and layouts only)
├── (public)/
│   └── sign-in/page.tsx      # Buddy sign-in screen (FR-016)
├── (app)/
│   ├── layout.tsx            # Auth guard, greeting shell (FR-018)
│   └── page.tsx              # Mood and focus picker and suggestion view
├── library/
│   └── [focus]/page.tsx      # Browse templates for a focus area (FR-009)
└── api/
    ├── suggestions/route.ts  # POST suggestions (FR-004, FR-007)
    ├── suggestions/next/route.ts  # POST another idea (FR-007, FR-008)
    ├── templates/route.ts    # GET filtered templates (FR-009)
    └── me/route.ts           # GET current user

src/
├── features/
│   ├── library/              # Template loading, validation, filtering
│   ├── suggestions/          # Selection logic: mood, focus, no-repeat rule
│   ├── moods/                # Mood definitions and buddy copy per mood
│   └── auth/                 # Auth0 session helpers, user upsert
├── lib/
│   ├── db/                   # Drizzle client and schema
│   ├── config/env.ts         # Startup validation of required env vars
│   └── api/envelope.ts       # Shared success/error response envelope
└── components/               # Buddy character, mood cards, template card, UI primitives

content/
└── templates/                # Versioned JSON, one file per focus area (100+ templates)

tests/
├── unit/                     # Pure selection logic, filters, validators, envelope
├── integration/              # Route handlers against a test database
└── e2e/                      # Playwright: sign-in, pick mood, get idea, library browse
```

**Structure Decision**: One Next.js project. Route files under `app/` stay thin and delegate to
feature modules under `src/features/`, so the business rules (mood matching, no-repeat, filtering)
are plain functions that unit tests can cover without a server. Storage access goes through
`src/lib/db`, so feature code depends on repository functions, not on Drizzle directly
(constitution III).

## Complexity Tracking

> Fill ONLY if Constitution Check has violations that must be justified

No violations. The table is intentionally empty.
