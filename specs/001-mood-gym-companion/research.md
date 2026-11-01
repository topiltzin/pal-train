# Research: Mood-Based Gym Companion

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Date**: 2026-10-31

This file resolves every technical choice that the plan depends on. Each entry records the
decision, the reason, and the alternatives considered.

## 1. Web framework: Next.js (App Router)

- **Decision**: Next.js 16 with the App Router, TypeScript, and route handlers for the JSON API.
- **Rationale**: The current docs (checked through Context7, `/vercel/next.js` v16.2.9) show route
  handlers as `app/api/.../route.ts` exports that return Web `Response` objects, using
  `Response.json` for JSON. Server components let the sign-in gate and the greeting render on the
  server. Vercel is the target host, and Next.js is its first-class framework.
- **Alternatives considered**:
  - Vite + React SPA with a separate API: more moving parts (two deployments, CORS, separate auth
    wiring) for a small app.
  - SvelteKit or Nuxt: viable, but the team's existing tooling and the Vercel default point to
    Next.js. No requirement favors them.

## 2. Sign-in: Auth0 via the Vercel Marketplace

- **Decision**: Auth0 as the identity provider, with the Auth0 Next.js SDK (`@auth0/nextjs-auth0`)
  for sessions. Email and password use an Auth0 database connection. Provisioning goes through
  `vercel integration add`.
- **Rationale**: Sign-in is a hard requirement (FR-012, FR-016). The marketplace guidance requires a
  real provisioned integration and forbids mocks. `vercel integration discover --category
  authentication` returned Auth0, Clerk, Descope, Supabase, and Neon. Auth0 is the top relevant
  general result, so per the marketplace rule it is the recommendation. The Auth0 Next.js SDK is a
  High-reputation library in Context7 (`/auth0/nextjs-auth0`, 2537 snippets).
- **Alternatives considered**:
  - Clerk: a strong option with prebuilt UI, and it is listed. Rejected for now because the
    marketplace rule takes the top relevant result, and the sign-in screen must match the buddy
    design, which is easier to style with our own components.
  - Roll-your-own password auth: rejected. Password storage and reset are security-critical, and
    the constitution's quality gates require security review for auth code.
  - **Open item**: the `vercel:auth` skill should confirm the Auth0 choice before provisioning, as
    the marketplace skill directs.

## 3. Database: Neon Postgres via the Vercel Marketplace

- **Decision**: Neon Postgres, provisioned as a marketplace integration.
- **Rationale**: Users and suggestion state are relational and small. Postgres is the default for
  this shape of data. Discovery in the `storage` category returned Neon, Supabase, Prisma Postgres,
  and Aurora PostgreSQL. Neon is the Postgres option Vercel's storage guidance names. The `vercel-storage`
  skill covers the database itself.
- **Alternatives considered**:
  - Supabase: a viable Postgres with auth included, but auth is already decided, so it would add a
    second auth system.
  - Upstash Redis: suitable for caching, not for durable user records.
  - No database (cookie-only state): simpler, but it cannot satisfy the requirement that the
    no-repeat rule works across sessions for signed-in users.
- **Open item**: confirm the exact Neon integration name and region in `vercel:storage` at implementation.

## 4. Data access: Drizzle ORM

- **Decision**: Drizzle ORM with `drizzle-kit` for migrations, behind a repository layer in
  `src/lib/db`.
- **Rationale**: Typed SQL with no heavy runtime, a good fit for serverless functions, and it keeps
  queries explicit, which suits the constitution's readability rules. The repository layer
  satisfies constitution III (business logic depends on abstractions).
- **Alternatives considered**: Prisma (heavier runtime and generated client), raw `pg` (no typed
  schema, more hand-written code). Both were considered; Drizzle wins on size and clarity.
- **Verification**: confirm the Drizzle Neon driver API in Context7 at implementation time.

## 5. Input validation: zod

- **Decision**: zod schemas at every API boundary and for template content files.
- **Rationale**: constitution I requires boundary validation. zod gives one schema for runtime
  validation and the TypeScript type. The same schema validates the template JSON at build time,
  so a malformed template fails the build rather than the page.
- **Alternatives considered**: hand-written guards (more code, easier to miss fields), Joi or Yup
  (no advantage here).

## 6. Styling and playful visual direction: Tailwind CSS

- **Decision**: Tailwind CSS for styling, with the playful buddy theme defined as design tokens
  (color, radius, motion) that the mood selects.
- **Rationale**: The spec asks for a fun, mood-reactive visual style (FR-017). Tailwind keeps the
  styles co-located and makes theme tokens easy to vary per mood. The `design-taste-frontend` skill
  is the guide for the final visual choices, and it is applied during implementation.
- **Alternatives considered**: CSS Modules (more files, harder to theme per mood), styled-components
  (runtime cost, not needed).
- **Verification**: check the Tailwind version against Context7 at implementation time.

## 7. Testing: Vitest and Playwright

- **Decision**: Vitest for unit and integration tests, with V8 coverage and an 80% threshold.
  Playwright for end-to-end flows.
- **Rationale**: Vitest is fast with TypeScript and works for both pure functions and route handlers.
  Playwright covers the critical flows in constitution II and measures the phone-width requirement
  (SC-006) by running at a 320 px viewport.
- **Alternatives considered**: Jest (slower with ESM and TypeScript), Cypress (heavier to run in CI).

## 8. Workout template content: repository JSON, validated at build

- **Decision**: Templates live in `content/templates/*.json`, one file per focus area, generated
  with the `fitness-coach` skill (a separate task). A zod schema validates them at build time, and
  the library module loads them into memory at startup.
- **Rationale**: Version 1 needs no admin UI. Content in git gets review, history, and diffs. The
  spec has no requirement to edit templates from the page. A database table would add a migration
  path with no user-facing benefit yet.
- **Alternatives considered**: a `workout_templates` table (valuable later for editing, not needed
  now; can be added without changing the API contract).

## 9. No-repeat rule: stored last-shown template

- **Decision**: `suggestion_state` keeps one row per user with the last template shown.
- **Rationale**: FR-008 requires that the immediately previous suggestion is not repeated. The rule
  must hold across requests and devices for signed-in users, so the state belongs in the database,
  not the browser.

## 10. Hosting and deployment

- **Decision**: Vercel, with Fluid Compute (default Node.js runtime). Environment variables come
  from `vercel env pull` for local development. Preview deployments for each branch.
- **Rationale**: Vercel is the platform for this stack, and the marketplace integrations inject
  their environment variables automatically.
- **Note**: the Edge runtime is deprecated, so route handlers use the default Node.js runtime.

## Summary of open items

1. Confirm Auth0 with the `vercel:auth` skill before provisioning.
2. Confirm the Neon integration name and region with `vercel:storage`.
3. Verify Drizzle, zod, and Tailwind APIs against Context7 during implementation.
4. Generate the 100+ template content with `/fitness-coach` (separate task).
