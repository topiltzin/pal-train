"use client";

import WakeSlider from "@/components/wake-slider";
import { clampRange, type SessionLengthRange } from "@/features/sessions/range";
import { isTooShort, SHORTEST_MINUTES } from "@/features/sessions/session-cap";
import { MAX_MINUTES, SLIDER_MIN_MINUTES, STEP_MINUTES } from "@/features/sessions/session-length";

const METER_LABEL = "Session length";
const FILL_COLOR = "var(--accent)";
const TRACK_COLOR = "rgb(255 255 255 / 0.12)";

type SessionLengthControlProps = {
  value: SessionLengthRange;
  /** Fires on every movement, so the value can update while the slider is dragged. */
  onChange: (next: SessionLengthRange) => void;
  /** Fires when the pointer is released, a key is lifted, or focus leaves the slider. */
  onCommit: () => void;
  /** The longest session allowed for the current mood. Movements past it stop here. */
  limit?: number;
  /** Fires when the user tries to go past `limit`, so the planner can explain why. */
  onLimitReached?: () => void;
  /** Fires when the user drags below the shortest plan. The value is raised to that minimum. */
  onShortReached?: () => void;
};

/**
 * One handle sets the longest session. The minimum stays at 0 and the exercise count drives the plan.
 * The Wake Slider draws the bars and handles the drag and the keys; the legend under it explains
 * how to set the time and any limit the mood applies.
 */
export function SessionLengthControl({
  value,
  onChange,
  onCommit,
  limit = MAX_MINUTES,
  onLimitReached,
  onShortReached,
}: SessionLengthControlProps) {
  function handleMove(next: number) {
    if (next > limit) onLimitReached?.();
    if (isTooShort(next)) onShortReached?.();
    const bounded = Math.min(Math.max(next, SHORTEST_MINUTES), limit);
    onChange(clampRange("max", bounded, value));
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-base font-semibold" aria-live="polite">
        Up to {value.maxMinutes} minutes
      </p>
      <div onPointerUp={onCommit} onKeyUp={onCommit} onBlur={onCommit}>
        <WakeSlider
          value={value.maxMinutes}
          onChange={handleMove}
          min={SLIDER_MIN_MINUTES}
          max={MAX_MINUTES}
          step={STEP_MINUTES}
          formatValue={(minutes) => `${minutes} minutes`}
          ariaLabel={METER_LABEL}
          fillColor={FILL_COLOR}
          trackColor={TRACK_COLOR}
          className="w-full"
        />
      </div>
      <div aria-hidden className="flex justify-between text-xs text-muted">
        <span>{SLIDER_MIN_MINUTES}</span>
        <span>{MAX_MINUTES} min</span>
      </div>
      <p className="text-sm text-muted">
        Drag the bars, or use the arrow keys, to set the longest session. Each step is{" "}
        {STEP_MINUTES} minutes. Plans run from {SHORTEST_MINUTES} minutes up to the longest you set.
        {limit < MAX_MINUTES ? ` This mood keeps sessions to ${limit} minutes or less.` : null}
      </p>
    </div>
  );
}
