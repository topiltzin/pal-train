import type { Template } from "@/features/library/template.schema";

export type SuggestionView = {
  id: string;
  name: string;
  focus: Template["focus"];
  moods: Template["moods"];
  durationMinutes: number;
  intensity: Template["intensity"];
  equipment: string[];
  description: string;
  caution?: string;
};

export function toSuggestionView(template: Template): SuggestionView {
  return {
    id: template.id,
    name: template.name,
    focus: template.focus,
    moods: template.moods,
    durationMinutes: template.duration_minutes,
    intensity: template.intensity,
    equipment: template.equipment,
    description: template.description,
    caution: template.caution,
  };
}
