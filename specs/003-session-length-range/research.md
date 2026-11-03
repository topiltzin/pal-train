# Research: Session Length Range

All NEEDS CLARIFICATION items from the plan were resolved. The spec had none open.

## 1. Where exercise data comes from

**Decision**: Add a new exercise dataset at `content/exercises/`, one file per focus area, validated with a Zod schema and bundled the same way as the templates.

**Rationale**: The existing library stores whole routines with a single duration. Each routine could be split into exercises, but that would invent per-exercise minutes and equipment that no one has written. A dedicated dataset keeps the data honest and lets the browse pages keep working unchanged.

**Alternatives considered**:
- Derive exercises from templates by treating each template as one "exercise": rejected, because the spec requires variable counts (3 to 10), which needs more granular items than routines.
- Store exercises in the database: rejected for now. The library is read-only content, and the existing pattern uses bundled JSON. A database would add a migration and a query layer with no current need (YAGNI).

## 2. Exercise count rule

**Decision**: Linear rule on the maximum: `3 + round((max - 10) / 80 * 7)`, giving 3 at 10 minutes and 10 at 90.

**Rationale**: Simple to explain, monotonic (never decreases as the range grows), and matches the spec's two anchor points. The spec leaves the middle to planning.

**Alternatives considered**:
- Count from the minimum: rejected, because a wide range would then give too few exercises to use the time available.
- Stepped table of counts per length: rejected as more data than the rule needs. It can be swapped in later without changing the API.

## 3. Range control implementation

**Decision**: Two native `<input type="range">` elements overlaid on one track, with clamping in a pure function.

**Rationale**: Native inputs give keyboard arrows, touch dragging, and screen-reader roles for free. They pass accessibility requirements (FR-006) with less code than a custom widget. No dependency is added (constitution III).

**Alternatives considered**:
- A third-party range slider library: rejected. The problem is small, and constitution III requires a justification for each new dependency.
- A custom pointer-driven slider: rejected. It would need its own keyboard, touch, and screen-reader handling.

## 4. When the plan is requested

**Decision**: Request on release, key up, or blur of a handle, not on each change event.

**Rationale**: Avoids a network request for every pixel of a drag. The text still updates live, so the user sees the range immediately.

**Alternatives considered**:
- Debounced requests while dragging: rejected as more timing logic for a small gain.

## 5. Determinism and testing

**Decision**: The planner takes an injected `random` function, as `select-suggestions.ts` does.

**Rationale**: Tests can fix the order and assert exact outputs. Production uses `Math.random`.

## 6. Shared limits

**Decision**: Move the 10 to 90 minute limits into `src/features/sessions/session-length.ts` and have the existing template query code import them.

**Rationale**: One source for the range, so the two features cannot drift apart. The existing constants are duplicated today.

## 7. Risks

- **Thin exercise coverage**: if a focus area has too few exercises, a 90-minute session cannot reach 10 exercises and will show the shortfall message. Mitigation: author enough exercises per focus area during content work, and let the validation script report counts per focus.
- **Mood and focus combinations**: a mood with few exercises for a focus gives `partial` plans. This is accepted behavior per the spec's edge cases.
