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
        <p role="status" className="text-sm text-muted">
          {notice}
        </p>
      ) : null}
      {plan && hasExercises ? (
        <>
          <p data-testid="session-total" className="flex items-baseline gap-2">
            <span className="text-4xl font-semibold tabular-nums">{plan.totalMinutes}</span>
            <span className="text-sm text-muted">minutes</span>
          </p>
          <ul className="flex flex-col gap-2">
            {plan.exercises.map((exercise) => (
              <li key={exercise.id} className="flex flex-col gap-1 rounded-2xl bg-surface px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="min-w-0 font-medium">{exercise.name}</span>
                  <span data-testid="exercise-minutes" className="shrink-0 text-sm text-muted">
                    {exercise.minutes}
                  </span>
                </div>
                <p data-testid="exercise-equipment" className="text-sm text-muted">
                  {exercise.equipment.join(", ")}
                </p>
                {exercise.caution ? (
                  <p data-testid="exercise-caution" className="text-sm text-muted">
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
