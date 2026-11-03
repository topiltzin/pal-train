import type { SessionPlanView } from "@/features/sessions/handle-session-plan";

type SessionPlanListProps = {
  plan: SessionPlanView | null;
  notice: string | null;
};

export function SessionPlanList({ plan, notice }: SessionPlanListProps) {
  const hasExercises = plan !== null && plan.exercises.length > 0;
  return (
    <div className="flex flex-col gap-4">
      {notice ? (
        <p role="status" className="text-sm text-black/70">
          {notice}
        </p>
      ) : null}
      {plan && hasExercises ? (
        <>
          <p data-testid="session-total" className="text-base font-semibold">
            {plan.totalMinutes} minutes
          </p>
          <ul className="flex flex-col gap-2">
            {plan.exercises.map((exercise) => (
              <li key={exercise.id} className="flex flex-col gap-1 rounded-2xl bg-white px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="min-w-0 font-medium">{exercise.name}</span>
                  <span data-testid="exercise-minutes" className="shrink-0 text-sm text-black/70">
                    {exercise.minutes}
                  </span>
                </div>
                <p data-testid="exercise-equipment" className="text-sm text-black/60">
                  {exercise.equipment.join(", ")}
                </p>
                {exercise.caution ? (
                  <p data-testid="exercise-caution" className="text-sm text-black/80">
                    {exercise.caution}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}
