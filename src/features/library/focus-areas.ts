export const focusIds = [
  "chest",
  "biceps",
  "triceps",
  "back",
  "legs",
  "cardio",
  "hyrox-style",
  "conditioning",
  "calisthenics",
  "stretching",
] as const;

export type FocusId = (typeof focusIds)[number];

export type FocusArea = {
  id: FocusId;
  label: string;
  description: string;
};

export const focusAreas: readonly FocusArea[] = [
  { id: "chest", label: "Chest", description: "Pressing and chest work." },
  { id: "biceps", label: "Biceps", description: "Curls and elbow-flexion work." },
  { id: "triceps", label: "Triceps", description: "Extension and pressing-lockout work." },
  { id: "back", label: "Back", description: "Rows, pulls, and posterior chain work." },
  { id: "legs", label: "Legs", description: "Squat, hinge, and lunge patterns." },
  { id: "cardio", label: "Cardio", description: "Sustained heart-rate work." },
  { id: "hyrox-style", label: "Hyrox-style", description: "Functional race-style intervals." },
  { id: "conditioning", label: "Conditioning", description: "General work capacity and circuits." },
  {
    id: "calisthenics",
    label: "Calisthenics",
    description: "Bodyweight strength, control, and skills.",
  },
  {
    id: "stretching",
    label: "Stretching",
    description: "Mobility holds and recovery for the whole body.",
  },
];
