# Research: Swap an Exercise for Another of the Same Type

No open NEEDS CLARIFICATION items remain. The spec's interpretation choices are recorded in [spec.md](spec.md) under "Clarifications and Interpretation" and "Assumptions".

## Decision 1: Alternatives come from a new stateless server endpoint

- **Decision**: Add `POST /api/exercise-alternatives`. Given one plan exercise and the plan's current exercise ids, it returns every other exercise of the same muscle group, with an availability flag for each. The client never loads the exercise library.
- **Rationale**: The exercise library is parsed and held on the server (`loadExerciseLibrary`). Sending it to the browser would ship all content for one feature. The plan already travels through an API; swaps follow the same pattern. Nothing is stored, which matches spec 011 and the spec's assumption of no saved plans.
- **Alternatives considered**:
  - *Ship the whole library to the client.* Rejected: larger payload, and the length rule would be re-implemented in the browser.
  - *Re-run the planner with the card's slot pinned.* Rejected: a planner call chooses a whole new set, and it does not give a list of same-type options.
  - *Store the plan server-side and swap there.* Rejected: spec Assumption says nothing is saved between visits.

## Decision 2: Length check is computed on the server from library minutes

- **Decision**: The request sends the plan's exercise ids and its minute range, not the minutes. The server looks up each minute value and computes the total that a swap would produce.
- **Rationale**: Minutes are content, so the server is the single source of truth (Constitution I: validate at the boundary, do not trust client input). It also keeps the rule in one place for both the swap list and any future connector use.
- **Alternatives considered**: Client-side check. Rejected: duplicates the rule and trusts client-supplied minutes.

## Decision 3: Options exclude exercises already in the plan; over-length options are shown unavailable

- **Decision**: Exercises already in the plan (and the card's own exercise) are not returned at all (FR-004). Same-type exercises that would push the total outside the range are returned with `available: false` and reason `over_length` (FR-007).
- **Rationale**: "Already in plan" is never a useful option, so it is hidden. "Too long" is useful to show, because the person sees why a choice is missing.
- **Alternatives considered**: Hide over-length options too. Rejected: the person could not tell why the list is short.

## Decision 4: Cycling order is the library order, applied on the client

- **Decision**: The server returns options in library order. The client's "swap" control takes the next available option after the card's last one, wrapping around (FR-005). "Choose one" opens the full list (FR-006).
- **Rationale**: Stable ordering makes repeated swaps predictable and testable. Keeping the cursor on the client avoids a server round trip per tap.
- **Alternatives considered**: Random choice. Rejected: a random pick can repeat the same exercise, and a test cannot check it.

## Decision 5: Shared demo lookup is extracted, not copied

- **Decision**: Move `attachActiveDemos` out of `handle-session-plan.ts` into its own module so the plan endpoint and the alternatives endpoint use the same code.
- **Rationale**: FR-010 and FR-011 require the same demo behavior (and the same failure fallback) for replacements. Copying would drift (Constitution III: DRY, no duplicate logic).
- **Alternatives considered**: Import the private function by exporting it from the plan handler. Rejected: couples the alternatives feature to the plan handler's module.

## Decision 6: Timer lock is driven by a running-state callback

- **Decision**: `WorkoutTimer` reports whether it is running through an optional `onRunningChange` prop. The planner keeps that flag and passes it to the card list to disable swap controls (FR-009).
- **Rationale**: The timer owns its state, so the parent learns about it through one callback. No shared store is needed.
- **Alternatives considered**: A global store for timer state. Rejected: one consumer, so it would be speculative (Constitution III: YAGNI).

## Decision 7: Card UI extracted into its own component, same visual style

- **Decision**: Pull each plan row out of `session-plan-list.tsx` into `exercise-card.tsx`, keep the existing surface, padding, and typography, and add the swap controls there. The options list is a separate component, `exercise-swap-options.tsx`.
- **Rationale**: `session-plan-list.tsx` is about 70 lines today. Adding swap state and options to it would mix list layout with card behavior. Spec FR-013 asks for the existing style, so no new visual language is introduced.
- **Alternatives considered**: Adding everything to the list file. Rejected: harder to test and review.
- **Icons**: Phosphor (`@phosphor-icons/react`, already a dependency), matching the existing "Another idea" button.
- **Motion**: Motion (`motion/react`, already a dependency). A short fade replaces the card; under reduced motion the change is instant (FR-014).

## Decision 8: Analytics event follows the existing catalog

- **Decision**: Add one event, "exercise swapped", to `src/features/analytics/event-catalog.ts`, with properties limited to exercise ids and the muscle group (FR-015).
- **Rationale**: The catalog is the existing pattern for tracked events, and it keeps the list of tracked properties reviewable.
