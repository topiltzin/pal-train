"use client";

import WakeSlider from "@/components/wake-slider";
import { clampRange, type SessionLengthRange } from "@/features/sessions/range";
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
};

/**
 * One handle sets the longest session. The minimum stays at 0 and the exercise count drives the plan.
 * The Wake Slider draws the bars and handles the drag and the keys; the value is announced by the
 * slider's own ARIA values, and the sentence above it says the same thing for everyone.
 */
export function SessionLengthControl({ value, onChange, onCommit }: SessionLengthControlProps) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-base font-semibold" aria-live="polite">
        Up to {value.maxMinutes} minutes
      </p>
      <div onPointerUp={onCommit} onKeyUp={onCommit} onBlur={onCommit}>
        <WakeSlider
          value={value.maxMinutes}
          onChange={(next) => onChange(clampRange("max", next, value))}
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
    </div>
  );
}
