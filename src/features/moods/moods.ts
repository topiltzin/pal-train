export const moodIds = [
  "energized",
  "tired",
  "stressed",
  "focused",
  "playful",
  "unmotivated",
  "want-to-sweat",
  "calm",
] as const;

export type MoodId = (typeof moodIds)[number];

export const intensityLevels = ["low", "moderate", "high"] as const;

export type IntensityLevel = (typeof intensityLevels)[number];

export type Mood = {
  id: MoodId;
  label: string;
  buddyLine: string;
  accent: string;
  intensityRange: IntensityLevel;
};

export const moods: readonly Mood[] = [
  {
    id: "energized",
    label: "Energized",
    buddyLine: "Let's go, you've got fuel! Pick something that matches the spark.",
    accent: "accent-sunrise",
    intensityRange: "high",
  },
  {
    id: "tired",
    label: "Tired",
    buddyLine: "Rough day? We can keep it gentle and still get something done.",
    accent: "accent-lilac",
    intensityRange: "low",
  },
  {
    id: "stressed",
    label: "Stressed",
    buddyLine: "Let's move that tension out. Steady and controlled works well here.",
    accent: "accent-coral",
    intensityRange: "moderate",
  },
  {
    id: "focused",
    label: "Focused",
    buddyLine: "Locked in. Pick a plan that rewards good form and attention.",
    accent: "accent-mint",
    intensityRange: "moderate",
  },
  {
    id: "playful",
    label: "Playful",
    buddyLine: "Feeling silly? Let's make it fun. Try something you can laugh through.",
    accent: "accent-pink",
    intensityRange: "moderate",
  },
  {
    id: "unmotivated",
    label: "Unmotivated",
    buddyLine: "Not feeling it? Just start small. Short ideas count too.",
    accent: "accent-sky",
    intensityRange: "low",
  },
  {
    id: "want-to-sweat",
    label: "Want to Sweat",
    buddyLine: "Heart rate up, lungs open. Here are some ideas to get sweaty.",
    accent: "accent-tangerine",
    intensityRange: "high",
  },
  {
    id: "calm",
    label: "Calm",
    buddyLine: "Easy does it. Smooth movement, no pressure.",
    accent: "accent-seafoam",
    intensityRange: "low",
  },
];
