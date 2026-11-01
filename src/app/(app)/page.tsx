import { HomeExperience } from "@/components/home-experience";
import { focusAreas } from "@/features/library/focus-areas";
import { moods } from "@/features/moods/moods";

export default function HomePage() {
  return <HomeExperience moods={moods} focusAreas={focusAreas} />;
}
