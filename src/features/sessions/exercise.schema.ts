import { z } from "zod";
import { focusIds } from "@/features/library/focus-areas";
import { intensityLevels, moodIds } from "@/features/moods/moods";

const NAME_MIN = 3;
const NAME_MAX = 60;
const MINUTES_MIN = 1;
const MINUTES_MAX = 30;
const MOODS_MIN = 1;
const MOODS_MAX = 4;
const EXERCISE_ID_PATTERN = /^[a-z-]+-\d{3}$/;
const DESCRIPTION_MAX = 200;

export const exerciseSchema = z
  .object({
    id: z.string().regex(EXERCISE_ID_PATTERN),
    name: z.string().min(NAME_MIN).max(NAME_MAX),
    description: z.string().min(1).max(DESCRIPTION_MAX).optional(),
    focus: z.enum(focusIds),
    moods: z.array(z.enum(moodIds)).min(MOODS_MIN).max(MOODS_MAX),
    minutes: z.number().int().min(MINUTES_MIN).max(MINUTES_MAX),
    intensity: z.enum(intensityLevels),
    equipment: z.array(z.string().min(1)).min(1),
    caution: z.string().min(1).optional(),
  })
  .superRefine((exercise, context) => {
    if (exercise.intensity === "high" && !exercise.caution) {
      context.addIssue({
        code: "custom",
        path: ["caution"],
        message: "A high-intensity exercise requires a caution.",
      });
    }
  });

export const exercisesSchema = exerciseSchema.array();

export type Exercise = z.infer<typeof exerciseSchema>;
