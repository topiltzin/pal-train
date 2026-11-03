"use client";

import type { ChangeEvent } from "react";
import { clampRange, type RangeHandle, type SessionLengthRange } from "@/features/sessions/range";
import { MAX_MINUTES, MIN_MINUTES, STEP_MINUTES } from "@/features/sessions/session-length";

const SHORTEST_LABEL = "Shortest session";
const LONGEST_LABEL = "Longest session";
/** Within one step of the top, the minimum thumb sits above the maximum so it stays grabbable. */
const TOP_EDGE_MINUTES = MAX_MINUTES - STEP_MINUTES;

type SessionLengthControlProps = {
  value: SessionLengthRange;
  /** Fires on every movement, so the text can update while a handle is dragged. */
  onChange: (next: SessionLengthRange) => void;
  /** Fires when a handle is released, a key is lifted, or focus leaves the bar. */
  onCommit: () => void;
};

function percentOf(minutes: number): number {
  return ((minutes - MIN_MINUTES) / (MAX_MINUTES - MIN_MINUTES)) * 100;
}

export function SessionLengthControl({ value, onChange, onCommit }: SessionLengthControlProps) {
  const { minMinutes, maxMinutes } = value;
  const minOnTop = minMinutes >= TOP_EDGE_MINUTES;

  function handleMove(handle: RangeHandle) {
    return (event: ChangeEvent<HTMLInputElement>) => {
      onChange(clampRange(handle, Number(event.target.value), value));
    };
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-semibold" aria-live="polite">
        {minMinutes} to {maxMinutes} minutes
      </p>
      <div className="relative h-11" onPointerUp={onCommit} onKeyUp={onCommit} onBlur={onCommit}>
        <div aria-hidden className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-black/10" />
        <div
          aria-hidden
          className="absolute top-1/2 h-2 -translate-y-1/2 rounded-full bg-[#14161f]"
          style={{ left: `${percentOf(minMinutes)}%`, right: `${100 - percentOf(maxMinutes)}%` }}
        />
        <input
          type="range"
          className="session-range"
          min={MIN_MINUTES}
          max={MAX_MINUTES}
          step={STEP_MINUTES}
          value={minMinutes}
          aria-label={SHORTEST_LABEL}
          aria-valuetext={`${minMinutes} minutes`}
          onChange={handleMove("min")}
          style={{ zIndex: minOnTop ? 2 : 1 }}
        />
        <input
          type="range"
          className="session-range"
          min={MIN_MINUTES}
          max={MAX_MINUTES}
          step={STEP_MINUTES}
          value={maxMinutes}
          aria-label={LONGEST_LABEL}
          aria-valuetext={`${maxMinutes} minutes`}
          onChange={handleMove("max")}
          style={{ zIndex: minOnTop ? 1 : 2 }}
        />
      </div>
    </div>
  );
}
