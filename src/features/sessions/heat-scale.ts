import {
  MAX_MINUTES,
  SLIDER_MIN_MINUTES,
  STEP_MINUTES,
} from "@/features/sessions/session-length";

/** One segment per 5-minute step on the bar, so 0 to 90 gives 18 segments. */
export const SEGMENT_COUNT = (MAX_MINUTES - SLIDER_MIN_MINUTES) / STEP_MINUTES;

const SHORTEST_HEIGHT_PERCENT = 30;
const TALLEST_HEIGHT_PERCENT = 100;
const GREEN_RGB = [52, 184, 122];
const AMBER_RGB = [240, 180, 41];
const RED_RGB = [229, 72, 77];
const MIDPOINT = 0.5;

function mix(from: readonly number[], to: readonly number[], amount: number): number[] {
  return from.map((channel, index) => Math.round(channel + (to[index] - channel) * amount));
}

/** How many segments light up for a length. Segment N lights once the length reaches N steps. */
export function litSegmentCount(minutes: number): number {
  const steps = Math.round((minutes - SLIDER_MIN_MINUTES) / STEP_MINUTES);
  return Math.min(SEGMENT_COUNT, Math.max(0, steps));
}

/** Segments start short and grow, like a volume meter. */
export function segmentHeightPercent(index: number): number {
  const fraction = index / (SEGMENT_COUNT - 1);
  return SHORTEST_HEIGHT_PERCENT + (TALLEST_HEIGHT_PERCENT - SHORTEST_HEIGHT_PERCENT) * fraction;
}

/** Green at the first segment, amber at the midpoint, red at the last. */
export function segmentColor(index: number): string {
  const fraction = index / (SEGMENT_COUNT - 1);
  const [red, green, blue] =
    fraction <= MIDPOINT
      ? mix(GREEN_RGB, AMBER_RGB, fraction / MIDPOINT)
      : mix(AMBER_RGB, RED_RGB, (fraction - MIDPOINT) / MIDPOINT);
  return `rgb(${red} ${green} ${blue})`;
}
