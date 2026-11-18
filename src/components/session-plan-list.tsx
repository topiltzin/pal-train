import { ExerciseCard } from "@/components/exercise-card";
import type { SwapControls } from "@/components/use-exercise-swaps";
import { WorkoutTimer } from "@/components/workout-timer";
import type { SessionPlanView } from "@/features/sessions/handle-session-plan";

const TIMER_LOCKED_TEXT = "Stop the timer to swap an exercise.";

type SessionPlanListProps = {
  plan: SessionPlanView | null;
  notice: string | null;
  /** A new plan is loading. The current one stays visible, dimmed. */
  busy?: boolean;
  swaps: SwapControls;
  /** Changes whenever a new plan is generated, so the timer starts fresh for it. */
  planRevision: number;
};

export function SessionPlanList({
  plan,
  notice,
  busy = false,
  swaps,
  planRevision,
}: SessionPlanListProps) {
  const hasExercises = plan !== null && plan.exercises.length > 0;
  return (
    <div className="flex flex-col gap-4">
      {notice ? (
        <p role="status" className="text-sm text-muted">
          {notice}
        </p>
      ) : null}
      {plan && hasExercises ? (
        <div
          aria-busy={busy}
          className={`flex flex-col gap-4 transition-opacity duration-200 ${busy ? "opacity-60" : "opacity-100"}`}
        >
          <p data-testid="session-total" className="flex items-baseline gap-2">
            <span className="text-4xl font-semibold tabular-nums">{plan.totalMinutes}</span>
            <span className="text-sm text-muted">minutes</span>
          </p>
          <WorkoutTimer
            key={`${planRevision}-${plan.totalMinutes}`}
            totalMinutes={plan.totalMinutes}
            onRunningChange={swaps.onTimerRunningChange}
          />
          <ul className="flex flex-col gap-2">
            {plan.exercises.map((exercise, index) => (
              // Keyed by position: a card keeps its place, and its focus, when it is swapped.
              <ExerciseCard
                key={index}
                exercise={exercise}
                swapDisabledReason={swaps.timerRunning ? TIMER_LOCKED_TEXT : null}
                swapping={swaps.swapping}
                message={swaps.message?.index === index ? swaps.message.text : null}
                onSwap={() => swaps.onSwap(index)}
                loadOptions={() => swaps.loadOptions(index)}
                onChoose={(option) => swaps.chooseOption(index, option)}
              />
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
