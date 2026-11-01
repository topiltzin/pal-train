<!--
SYNC IMPACT REPORT (temporary scratch material; remove before committing)

Version change: (unratified template) -> 1.0.0 (initial ratification)

Modified principles (template placeholders replaced):
- [PRINCIPLE_1_NAME] -> I. Code Quality
- [PRINCIPLE_2_NAME] -> II. Testing Standards
- [PRINCIPLE_3_NAME] -> III. Maintainability
- Template principle slots 4 and 5 were removed: the requested scope is three principles.

Added sections:
- Quality Gates (replaces [SECTION_2_NAME])
- Development Workflow (replaces [SECTION_3_NAME])
- Governance (rules filled in)

Removed sections: none

Deferred items / TODOs: none
Ratification date assumed to be the date of first adoption (2026-10-31).
-->

# Paltrain Constitution

## Core Principles

### I. Code Quality

Code in this project MUST be readable and explicit. The following rules are non-negotiable:

- Names MUST state what a value holds or what a function does. Comments MUST explain why, not what.
- Functions MUST stay under 50 lines. Nesting MUST NOT exceed 4 levels; use early returns instead.
- Errors MUST be handled explicitly at every boundary. Errors MUST NOT be swallowed silently.
  User-facing messages MUST be clear; server-side logs MUST carry the context needed to diagnose.
- Input from users, external APIs, and files MUST be validated at the system boundary before use.
- Code MUST NOT mutate shared or incoming data in place. Functions SHOULD return new values.
- Secrets and credentials MUST NOT appear in source code. They MUST come from environment
  variables or a secret manager, and required secrets MUST be validated at startup.
- Unnamed numeric or string literals that encode thresholds, limits, or delays MUST be replaced
  with named constants.
- Debug output (for example `console.log` or ad-hoc `print` calls) MUST NOT be committed.

Rationale: Explicit, small, well-named units are cheaper to review, safer to change, and less
likely to hide defects.

### II. Testing Standards

Behavior MUST be verified by automated tests. The following rules are non-negotiable:

- New features and bug fixes MUST follow test-first development: write a failing test (RED),
  write the minimal implementation to pass it (GREEN), then refactor (IMPROVE).
- A bug fix MUST begin with a test that reproduces the defect and fails before the fix.
- Test coverage MUST be at least 80%, measured by the project's coverage tool. New or modified
  code MUST be covered by tests.
- Tests MUST cover three levels where applicable:
  - Unit tests for functions, utilities, and components.
  - Integration tests for API endpoints and database operations.
  - End-to-end tests for critical user flows.
- Tests MUST be isolated and deterministic: no shared mutable state, no dependence on execution
  order, and no real network calls in unit tests.
- Test doubles (mocks, stubs) MUST reflect the real behavior of the dependency they replace.
- Tests MUST be structured as Arrange, Act, Assert, and their names MUST describe the behavior
  under test.
- When a test fails, the implementation MUST be fixed unless the test itself is wrong. Assertions
  MUST NOT be weakened to make a build pass. A skipped test MUST carry a tracked reason.

Rationale: Tests written first define the expected behavior and keep the suite trustworthy
enough to support refactoring without fear.

### III. Maintainability

The codebase MUST remain easy to change over its lifetime. The following rules are
non-negotiable:

- Source files SHOULD be 200 to 400 lines. Files over 800 lines are a maintainability defect and
  MUST either be split or carry a written justification (for example generated or vendored code).
- Code MUST be organized by feature or domain, not by technical layer, with high cohesion within
  each module and low coupling between modules.
- Business logic MUST depend on abstractions for storage and external services, so that it can
  be tested with substitutes.
- Dead code, unused imports, and unused feature flags MUST be removed in the same change that
  makes them unused.
- Abstractions and configuration options MUST NOT be added speculatively. An abstraction needs a
  concrete present use, not an anticipated one (YAGNI). The simplest working solution is preferred
  (KISS).
- Each commit SHOULD contain one logical change. Pull requests SHOULD stay small enough to review
  in a single sitting.
- Public interfaces MUST document behavior that is not obvious from their signatures.
- A new third-party dependency MUST be justified. Well-maintained libraries are preferred over
  hand-rolled utilities for solved problems.

Rationale: Most of a codebase's cost is spent changing it. Small, cohesive, decoupled, and tested
modules keep that cost bounded.

## Quality Gates

Every change MUST pass these gates before it is merged:

- All automated checks (tests, linting, type checking, build) MUST pass.
- Coverage MUST meet the 80% minimum defined in Principle II.
- The branch MUST be up to date with its target branch and free of merge conflicts before review.
- The change MUST be reviewed. Review findings are classified as follows:
  - CRITICAL (security vulnerability or data-loss risk): BLOCKS merge until fixed.
  - HIGH (bug or significant quality issue): MUST be fixed before merge, or the exception MUST be
    recorded in the pull request.
  - MEDIUM (maintainability concern): SHOULD be fixed; it is recorded as follow-up work if not.
  - LOW (style or minor suggestion): OPTIONAL.
- Changes touching authentication or authorization, user data, database queries, file system
  operations, external API calls, cryptography, or payments MUST receive a dedicated security
  review before merge.

## Development Workflow

Work on a feature MUST follow this sequence:

1. Research first: search the existing codebase and trusted libraries for an existing solution
   before writing new code.
2. Plan the change and identify its risks and dependencies.
3. Write tests first, following Principle II.
4. Implement the minimum code that passes the tests, then refactor.
5. Review the change against the Core Principles and Quality Gates.
6. Commit using Conventional Commits: `<type>: <description>`, where type is one of `feat`,
   `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, or `ci`.
7. Verify that all automated checks pass and the branch is current before requesting review.

## Governance

This constitution supersedes all other development practices in this repository. Where another
document conflicts with it, this constitution prevails.

- **Amendments**: Any change to this file MUST be proposed through a pull request that describes
  the change and its rationale. The pull request MUST be approved by the project maintainer
  before merge. If an amendment adds a MUST rule that existing code violates, the pull request
  MUST include a migration plan listing the violations and a schedule to resolve them.
- **Versioning**: This constitution follows semantic versioning.
  - MAJOR: a principle or governance rule is removed or redefined in a backward-incompatible way.
  - MINOR: a principle or section is added, or existing guidance is materially expanded.
  - PATCH: clarifications, wording changes, typo fixes, and non-semantic refinements.
- **Compliance review**: Every pull request and code review MUST verify compliance with the Core
  Principles and Quality Gates. A deliberate deviation MUST be justified in writing in the pull
  request and recorded so it can be revisited. Added complexity MUST be justified against
  Principle III.

**Version**: 1.0.0 | **Ratified**: 2026-10-31 | **Last Amended**: 2026-10-31
