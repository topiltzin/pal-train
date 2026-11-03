# Research: Upper Body, Shoulder, and Core Options

All NEEDS CLARIFICATION items were resolved. The spec had none open. The one interpretation (level means the existing intensity labels) is recorded in the spec's Assumptions and checklist notes.

## 1. Adding focus areas

**Decision**: Add the three ids to the closed `focusIds` tuple and to `focusAreas`. No other code changes for the new ids.

**Rationale**: `focusIds` already drives the content index types, the library routes, the template and exercise schemas, and the picker. One change reaches all of them, and the type checker finds any place that was missed.

**Alternatives considered**:
- A separate "body region" grouping with sub-areas: rejected. The spec asks for three options in the same menu, and a second level of grouping is speculative (YAGNI).
- Storing focus areas in the database: rejected for the same reason as in feature 003 (read-only content, no current need).

## 2. Routine and exercise content

**Decision**: Three new routine files and three new exercise files, one per area, loaded through the existing content index files.

**Rationale**: Matches the existing layout exactly, so the content check, schemas, and loaders work without changes.

**Alternatives considered**:
- Generating content with a script: rejected for routines. Routine descriptions and cautions need review, and a generator cannot check them against the rubric. The exercise data in feature 003 was generated from a table, which is acceptable there because each row was reviewed as it was written.

## 3. Level check rubric

**Decision**: Three levels, defined by effort and risk rather than by the user's experience:

- **low**: mobility, recovery, or controlled work with no load above light. No fast or explosive movement. Example: band pull-apart, doorway chest stretch.
- **moderate**: loaded sets or sustained bodyweight work the user can hold at a steady pace, without maximal effort. Example: goblet squat, dumbbell row.
- **high**: heavy loads, maximal or near-maximal effort, explosive or plyometric movement, or a skill with real injury risk. Requires a caution. Example: barbell bench press, box jump.

**Rationale**: Effort and risk are what a user needs to know before starting. The existing data already follows this pattern for most entries, so the rubric describes what is there.

**Alternatives considered**:
- Beginner, intermediate, advanced: rejected (spec Assumptions). It would need a new schema and new UI labels, and it would duplicate the existing scale.
- Reading level from the user's history: rejected. The app stores no training history, and this feature does not add it.

## 4. Level check process

**Decision**: Review every existing routine and exercise against the rubric, record each one in `level-check.md`, and change a level only when it does not match the rubric. Changed rows are flagged for review.

**Rationale**: The spec requires a record for every routine, not only for the ones that change. A recorded review is also the evidence for SC-003.

**Alternatives considered**:
- Automatic relabelling by keyword (for example "press" means high): rejected. It would mislabel routines, and the record would then only show that the script ran, not that each routine was read.
- Checking only a sample: rejected. SC-003 requires 100% coverage.

## 5. Minimum-content rule

**Decision**: Add a check to `scripts/validate-content.ts` that every focus area has at least 2 routines at each intensity level, and at least 10 exercises. Turn it on only after the level check and the new content pass it.

**Rationale**: Keeps the rule from failing the build before the content exists, and keeps FR-002 and FR-003 mechanically enforced afterwards.

## 6. Picker width

**Decision**: Keep the existing picker layout and verify it at 320 px with the phone-layout e2e check. Change the layout only if the check fails.

**Rationale**: Thirteen options may or may not wrap cleanly. Measuring first avoids a redesign that is not needed.

## 7. Risks

- **Level corrections change what users see**: a routine that moves from moderate to high now shows a caution. Mitigation: the record lists every change for review before merge.
- **Thin coverage for shoulders and core at low level**: most shoulder work is moderate or high. Mitigation: the content minimum requires two low-level routines per area, and the level check prefers low-effort mobility work to fill that gap.
