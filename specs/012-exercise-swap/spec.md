# Feature Specification: Swap an Exercise for Another of the Same Type

**Feature Branch**: `012-exercise-swap` (not created; no git hook ran)

**Created**: 2026-11-18

**Status**: Draft

**Input**: User description: "on the exercises, I need you set the exercises with the ability to switch to another "Barbel Curl" or another exercise of the same type... if you can add the same React like foto, but should be the Card types"

## Clarifications and Interpretation

- "Type" means the exercise's muscle group (the `focus` field: biceps, chest, legs, and so on). "Barbell curl" is a biceps exercise, so its alternatives are the other biceps exercises: Dumbbell curl, Hammer curl, Cable curl, and so on.
- "The same React like foto" had no attached image. This spec assumes the exercise cards keep the look of the existing exercise cards in the workout plan and the routine cards in the ideas list (rounded surface, bold name, muted metadata). A reference image can override this.
- The card changes apply to the exercise cards shown in a generated workout plan.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Swap an exercise for another of the same muscle group (Priority: P1)

A person has a generated workout that includes "Barbell curl". They do not have a barbell, or they want a change. On that exercise's card they choose a swap control. The card is replaced by another exercise that works the same muscle group, such as "Dumbbell curl", and the workout's total minutes update to match.

**Why this priority**: This is the core request. Without it, the person must regenerate the whole plan to change one exercise.

**Independent Test**: Generate a plan that includes a biceps exercise. Swap that card once. Confirm the new card is a different biceps exercise, no other card changed, and the total minutes reflect the new exercise.

**Acceptance Scenarios**:

1. **Given** a plan that includes "Barbell curl", **When** the person activates that card's swap control, **Then** the card shows a different biceps exercise, every other card stays the same, and the total minutes update.
2. **Given** a plan that includes "Barbell curl", **When** the person swaps it, **Then** the replacement is never an exercise that is already in the plan and never "Barbell curl" itself.
3. **Given** a swapped card, **When** the person activates swap again, **Then** the card moves to another biceps exercise not already in the plan, so repeated swaps cycle through the alternatives.

---

### User Story 2 - Choose the replacement from a list of same-type options (Priority: P2)

A person does not want a random replacement. They open the swap control on a card and see the other exercises of the same muscle group as small cards: name, minutes, equipment, and intensity. They tap one to replace the exercise.

**Why this priority**: Random swapping (Story 1) works, but choosing is how a person finds an exercise they can actually do with their equipment. This builds on Story 1.

**Independent Test**: Open the options for one card. Confirm every option is the same muscle group, is not already in the plan, and shows its equipment. Pick one and confirm that card now shows that exercise.

**Acceptance Scenarios**:

1. **Given** a card for "Barbell curl", **When** the person opens its options, **Then** each option is a biceps exercise, shows its name, minutes, equipment, and intensity, and "Barbell curl" is not listed.
2. **Given** the options list is open, **When** the person chooses "Hammer curl", **Then** the card becomes "Hammer curl", the list closes, and focus returns to the card.
3. **Given** the options list is open, **When** the person closes it without choosing, **Then** the card is unchanged.

---

### User Story 3 - Keep the workout within its length and count limits (Priority: P3)

A person chose a 20-minute workout. Swapping an 8-minute exercise for a 5-minute one must not push the workout outside the length range they picked, and it must not leave the workout with an unexpected number of exercises.

**Why this priority**: Swaps must respect the planner's promises. This is needed for a correct experience but is less visible than Stories 1 and 2.

**Independent Test**: Build a plan near the top of its range. Swap a card for a longer exercise and confirm the total stays within range or that the swap is refused with a clear reason.

**Acceptance Scenarios**:

1. **Given** a plan whose total is at the maximum length, **When** the person swaps a card for an exercise that would exceed the maximum, **Then** that option is shown as unavailable with a short reason, and the plan does not change.
2. **Given** a plan whose total is within range, **When** a swap keeps the total within the chosen minimum and maximum, **Then** the swap applies and the total updates.

---

### Edge Cases

- What happens when a muscle group has no other exercises in the library? The swap control is shown as unavailable with a message such as "No other exercises for this muscle group."
- What happens when every same-type exercise is already in the plan? The swap control is unavailable with the same message, and no card is removed.
- What happens when the person swaps during an active workout timer? Swapping is disabled while the timer is running, so the timer is not reset mid-workout. The control explains why.
- What happens when the replacement exercise has a demo video? The new card shows that demo's button, or no button if the demo is missing. Demo lookup failure does not block the swap.
- What happens when the replacement needs a caution (high intensity)? The caution text is shown on the new card, as on any other card.
- What happens when the person is using reduced motion? Card replacement is instant, with no sliding or fading.
- What happens on a narrow phone screen? The swap control and options fit on one column with a 16px side gutter and no horizontal scrolling.
- What happens when the plan is regenerated? Swapped choices are discarded and the new plan follows the normal rules.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Each exercise card in a generated workout MUST have a swap control.
- **FR-002**: A swap MUST replace only that card. Other cards, their order, and their minutes MUST NOT change.
- **FR-003**: A swap MUST choose replacements from exercises of the same muscle group as the card (the same `focus`).
- **FR-004**: A swap MUST NOT offer or choose an exercise already in the plan, or the card's own exercise.
- **FR-005**: Repeated swaps on the same card MUST cycle through the remaining same-type exercises in a stable order, so the person does not see the same replacement twice in a row.
- **FR-006**: The person MUST be able to open a list of same-type options for a card, showing each option's name, minutes, equipment, and intensity, and choose one to replace the card.
- **FR-007**: The workout's total minutes MUST update after each swap and MUST remain within the minimum and maximum length the person chose. Options that would break the range MUST be shown as unavailable with a short reason.
- **FR-008**: When a muscle group has no swappable alternatives, the swap control MUST be unavailable and explain why.
- **FR-009**: Swapping MUST be disabled while the workout timer is running, and the control MUST say why.
- **FR-010**: The replacement card MUST show the same details as any other card in the plan: name, description, minutes, equipment, caution when present, and demo button when a demo exists.
- **FR-011**: A failed demo lookup for a replacement MUST NOT block the swap.
- **FR-012**: Swap and option controls MUST be reachable and operable by keyboard, and their names MUST say what they do (for example "Swap Barbell curl").
- **FR-013**: The card and options visuals MUST follow the existing exercise card style and the app's color, type, radius, and icon conventions, with no new visual language.
- **FR-014**: Replacement MUST respect the reduced-motion preference: no slide or fade when reduced motion is on.
- **FR-015**: Swaps MUST NOT store personal data beyond what the plan already uses. Any analytics event for a swap MUST use only the exercise identifiers and the muscle group.

### Key Entities

- **Exercise**: A workout movement with a name, description, muscle group (`focus`), minutes, intensity, equipment, optional caution, and optional demo. Already exists in the exercise library.
- **Muscle group (exercise type)**: The `focus` value shared by exercises that work the same area. Swap candidates come from the same group.
- **Workout plan**: The ordered list of exercises with total minutes and the chosen length range. A swap changes one exercise in it.
- **Swap option**: A same-type exercise that could replace a card, with its availability (available, already in plan, or over the length limit) and the reason when unavailable.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A person can replace any exercise in a generated workout with a same-type alternative in two taps or fewer, without regenerating the whole plan.
- **SC-002**: In testing across every muscle group in the library, 100% of swap results are the same muscle group, not already in the plan, and within the chosen length range.
- **SC-003**: A person can choose a specific replacement from the options list in under 10 seconds.
- **SC-004**: Replacement and option controls can be operated by keyboard alone, and screen readers announce each control's purpose.
- **SC-005**: On a phone-width screen, no swap control, option card, or replacement card causes horizontal scrolling.

## Assumptions

- The exercise library already has enough exercises per muscle group for swapping to be useful. Each group in the current library has 10 or more exercises.
- The workout plan is generated on the page and is not saved between visits, so swapped choices last only until the plan is regenerated.
- The swap uses the exercise library's existing data. The data shape the page needs is for planning to decide.
- Equipment is shown on options but is not used to filter them, so a person sees every same-type option and decides for themselves.
- Analytics for swaps follow the existing event catalog and record no personal data.
- The timer rule (FR-009) is a default. If the person should be able to swap during a workout, that changes FR-009.
- Reduced-motion and keyboard rules follow the app's existing standards.
