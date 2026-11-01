import { z } from "zod";
import { focusIds } from "@/features/library/focus-areas";
import { intensityLevels, moodIds } from "@/features/moods/moods";

const NAME_MIN = 3;
const NAME_MAX = 60;
const DURATION_MIN_MINUTES = 10;
const DURATION_MAX_MINUTES = 90;
const MAX_MOODS_PER_TEMPLATE = 4;
const DESCRIPTION_MAX = 300;
const TEMPLATE_ID_PATTERN = /^[a-z-]+-\d{3}$/;

export const templateSchema = z
  .object({
    id: z.string().regex(TEMPLATE_ID_PATTERN),
    name: z.string().min(NAME_MIN).max(NAME_MAX),
    focus: z.enum(focusIds),
    moods: z.array(z.enum(moodIds)).min(1).max(MAX_MOODS_PER_TEMPLATE),
    duration_minutes: z.number().int().min(DURATION_MIN_MINUTES).max(DURATION_MAX_MINUTES),
    intensity: z.enum(intensityLevels),
    equipment: z.array(z.string().min(1)).min(1),
    description: z.string().min(1).max(DESCRIPTION_MAX),
    caution: z.string().min(1).optional(),
  })
  .superRefine((template, context) => {
    if (template.intensity === "high" && !template.caution) {
      context.addIssue({
        code: "custom",
        path: ["caution"],
        message: "A high-intensity template requires a caution.",
      });
    }
  });

export type Template = z.infer<typeof templateSchema>;
