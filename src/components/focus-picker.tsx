"use client";

import type { FocusArea, FocusId } from "@/features/library/focus-areas";

type FocusPickerProps = {
  focusAreas: readonly FocusArea[];
  selectedFocus: FocusId | null;
  onSelect: (focus: FocusId | null) => void;
};

export function FocusPicker({ focusAreas, selectedFocus, onSelect }: FocusPickerProps) {
  return (
    <div role="group" aria-label="Focus area" className="flex flex-wrap gap-2">
      {focusAreas.map((area) => {
        const isSelected = area.id === selectedFocus;
        return (
          <button
            key={area.id}
            type="button"
            aria-pressed={isSelected}
            title={area.description}
            onClick={() => onSelect(isSelected ? null : area.id)}
            className={`rounded-full border-2 px-3 py-1 text-sm font-semibold transition ${
              isSelected ? "border-black bg-black text-white" : "border-black/20 bg-white"
            }`}
          >
            {area.label}
          </button>
        );
      })}
    </div>
  );
}
