"use client";

import type { ChangeEvent } from "react";
import {
  litSegmentCount,
  segmentColor,
  segmentHeightPercent,
  SEGMENT_COUNT,
} from "@/features/sessions/heat-scale";
import { clampRange, type SessionLengthRange } from "@/features/sessions/range";
import {
  MAX_MINUTES,
  SLIDER_MIN_MINUTES,
  STEP_MINUTES,
} from "@/features/sessions/session-length";

const METER_LABEL = "Session length";
const UNLIT_SEGMENT = "rgb(255 255 255 / 0.08)";
const SEGMENT_INDEXES = Array.from({ length: SEGMENT_COUNT }, (_, index) => index);

type SessionLengthControlProps = {
  value: SessionLengthRange;
  /** Fires on every movement, so the value can update while the meter is dragged. */
  onChange: (next: SessionLengthRange) => void;
  /** Fires when the pointer is released, a key is lifted, or focus leaves the meter. */
  onCommit: () => void;
};

/**
 * One handle sets the longest session. The minimum stays at 0 and the exercise count drives the plan.
 * The segments are decoration; the native range input underneath does all input and announces the value.
 */
export function SessionLengthControl({ value, onChange, onCommit }: SessionLengthControlProps) {
  const litCount = litSegmentCount(value.maxMinutes);

  function handleMove(event: ChangeEvent<HTMLInputElement>) {
    onChange(clampRange("max", Number(event.target.value), value));
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-base font-semibold" aria-live="polite">
        Up to {value.maxMinutes} minutes
      </p>
      <div className="relative h-16 rounded-full focus-within:outline-3 focus-within:outline-offset-3 focus-within:outline-foreground">
        <div aria-hidden className="flex h-full items-end gap-1 px-1">
          {SEGMENT_INDEXES.map((index) => (
            <span
              key={index}
              className="flex-1 rounded-full transition-colors duration-150 ease-out motion-reduce:transition-none"
              style={{
                height: `${segmentHeightPercent(index)}%`,
                backgroundColor: index < litCount ? segmentColor(index) : UNLIT_SEGMENT,
              }}
            />
          ))}
        </div>
        <input
          type="range"
          aria-label={METER_LABEL}
          aria-valuetext={`${value.maxMinutes} minutes`}
          min={SLIDER_MIN_MINUTES}
          max={MAX_MINUTES}
          step={STEP_MINUTES}
          value={value.maxMinutes}
          onChange={handleMove}
          onPointerUp={onCommit}
          onKeyUp={onCommit}
          onBlur={onCommit}
          className="session-meter"
        />
      </div>
      <div aria-hidden className="flex justify-between text-xs text-muted">
        <span>{SLIDER_MIN_MINUTES}</span>
        <span>{MAX_MINUTES} min</span>
      </div>
    </div>
  );
}
