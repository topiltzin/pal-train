import { intensityLevels, type IntensityLevel } from "@/features/moods/moods";

export const MINUTE_OPTIONS = [10, 15, 20, 30, 45, 60, 90] as const;

type TemplateFiltersProps = {
  focus: string;
  intensity?: IntensityLevel;
  maxMinutes?: number;
};

export function TemplateFilters({ focus, intensity, maxMinutes }: TemplateFiltersProps) {
  return (
    <form method="get" aria-label="Filter workout ideas" className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="focus" value={focus} />
      <label className="flex flex-col text-sm font-semibold">
        Intensity
        <select name="intensity" defaultValue={intensity ?? ""} className="rounded-lg border p-2">
          <option value="">Any</option>
          {intensityLevels.map((level) => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col text-sm font-semibold">
        Up to
        <select name="maxMinutes" defaultValue={maxMinutes ?? ""} className="rounded-lg border p-2">
          <option value="">Any length</option>
          {MINUTE_OPTIONS.map((minutes) => (
            <option key={minutes} value={minutes}>
              {minutes} min
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white"
      >
        Apply
      </button>
    </form>
  );
}
