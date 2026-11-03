import Link from "next/link";
import { notFound } from "next/navigation";
import { LibraryError } from "@/components/library-error";
import { MedicalNotice } from "@/components/medical-notice";
import { focusAreas } from "@/features/library/focus-areas";
import { intensityLabel, intensityMeaning } from "@/features/library/intensity-label";
import { LibraryUnavailableError, loadLibrary } from "@/features/library/library-repository";

type TemplateDetailPageProps = {
  params: Promise<{ focus: string; id: string }>;
};

export default async function TemplateDetailPage({ params }: TemplateDetailPageProps) {
  const { focus, id } = await params;
  let template;
  try {
    template = loadLibrary().byId(id);
  } catch (error) {
    if (error instanceof LibraryUnavailableError) {
      return <LibraryError />;
    }
    throw error;
  }
  if (!template || template.focus !== focus) {
    notFound();
  }

  const area = focusAreas.find((candidate) => candidate.id === template.focus);
  return (
    <main className="flex flex-col gap-6 px-4 py-6">
      <Link href={`/library/${template.focus}`} className="text-sm font-semibold underline">
        Back to {area?.label ?? template.focus} ideas
      </Link>
      <article className="flex flex-col gap-3 rounded-2xl border-2 border-line bg-surface p-5">
        <h1 className="text-2xl font-bold">{template.name}</h1>
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <dt className="font-semibold">Focus</dt>
          <dd>{area?.label ?? template.focus}</dd>
          <dt className="font-semibold">Duration</dt>
          <dd>{template.duration_minutes} min</dd>
          <dt className="font-semibold">Intensity</dt>
          <dd>
            <span className="font-semibold">{intensityLabel(template.intensity)}</span>
            <span className="block text-sm text-muted">{intensityMeaning(template.intensity)}</span>
          </dd>
          <dt className="font-semibold">Equipment</dt>
          <dd>{template.equipment.join(", ")}</dd>
          <dt className="font-semibold">Good for</dt>
          <dd>{template.moods.join(", ")}</dd>
        </dl>
        <p>{template.description}</p>
        {template.caution ? (
          <p role="note" className="rounded-lg bg-amber-100 p-2 text-sm">
            Heads up: {template.caution}
          </p>
        ) : null}
      </article>
      <MedicalNotice />
    </main>
  );
}
