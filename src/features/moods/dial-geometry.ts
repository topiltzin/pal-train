/**
 * Pure angle maths for the circular mood dial. Angles are in degrees, clockwise,
 * with 0 at the top of the circle. Screen y grows downwards, so "up" is negative y.
 */

const FULL_TURN_DEG = 360;
const HALF_TURN_DEG = 180;

function normalizeAngle(angle: number): number {
  return ((angle % FULL_TURN_DEG) + FULL_TURN_DEG) % FULL_TURN_DEG;
}

/** Smallest signed rotation from one angle to another, in the range (-180, 180]. */
function shortestDelta(from: number, to: number): number {
  const delta = normalizeAngle(to - from);
  return delta > HALF_TURN_DEG ? delta - FULL_TURN_DEG : delta;
}

/** Angle of the mood slot at `index`, when `count` moods are spaced evenly around the dial. */
export function moodAngle(index: number, count: number): number {
  return (index * FULL_TURN_DEG) / count;
}

/** Angle of a pointer relative to the dial centre. `dx` and `dy` are offsets from the centre. */
export function pointerAngle(dx: number, dy: number): number {
  return normalizeAngle((Math.atan2(dx, -dy) * HALF_TURN_DEG) / Math.PI);
}

/** Index of the mood slot closest to `angle`. */
export function nearestIndex(angle: number, count: number): number {
  const step = FULL_TURN_DEG / count;
  return Math.round(normalizeAngle(angle) / step) % count;
}

/**
 * Keeps a continuously dragged angle unbroken across the 0/360 seam, so the
 * thumb never jumps back when the finger crosses the top of the dial.
 */
export function unwrapStep(previous: number, next: number): number {
  return previous + shortestDelta(normalizeAngle(previous), next);
}

/** Moves `current` to the mood slot at `index` by the shortest route. Returns an unwrapped angle. */
export function settleAngle(current: number, index: number, count: number): number {
  return unwrapStep(current, moodAngle(index, count));
}
