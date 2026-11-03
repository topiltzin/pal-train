"use client";

import { useEffect, useState } from "react";
import { SessionLengthControl } from "@/components/session-length-range";
import { SessionPlanList } from "@/components/session-plan-list";
import type { FocusId } from "@/features/library/focus-areas";
import type { MoodId } from "@/features/moods/moods";
import type { SessionPlanView } from "@/features/sessions/handle-session-plan";
import type { SessionLengthRange } from "@/features/sessions/range";
import { DEFAULT_MAX_MINUTES, DEFAULT_MIN_MINUTES } from "@/features/sessions/session-length";

const ENDPOINT = "/api/session-plan";
const PICK_SOURCE_NOTICE = "Pick a mood or a muscle group to plan a session.";
const GENERIC_ERROR = "I couldn't plan a session just now. Give it another try in a moment.";
const DEFAULT_RANGE: SessionLengthRange = {
  minMinutes: DEFAULT_MIN_MINUTES,
  maxMinutes: DEFAULT_MAX_MINUTES,
};

type ApiResponse = {
  success: boolean;
  data: SessionPlanView | null;
  error: { code: string; message: string } | null;
};

type SessionPlannerProps = {
  mood?: MoodId;
  focus?: FocusId;
};

function sameRange(first: SessionLengthRange, second: SessionLengthRange): boolean {
  return first.minMinutes === second.minMinutes && first.maxMinutes === second.maxMinutes;
}

async function fetchPlan(
  range: SessionLengthRange,
  mood: MoodId | undefined,
  focus: FocusId | undefined,
  signal: AbortSignal,
): Promise<ApiResponse> {
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ...range, ...(mood ? { mood } : {}), ...(focus ? { focus } : {}) }),
    signal,
  });
  return (await response.json()) as ApiResponse;
}

export function SessionPlanner({ mood, focus }: SessionPlannerProps) {
  const [liveRange, setLiveRange] = useState(DEFAULT_RANGE);
  const [committedRange, setCommittedRange] = useState(DEFAULT_RANGE);
  const [plan, setPlan] = useState<SessionPlanView | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const hasSource = mood !== undefined || focus !== undefined;

  useEffect(() => {
    if (!hasSource) {
      return;
    }
    const controller = new AbortController();
    fetchPlan(committedRange, mood, focus, controller.signal)
      .then((response) => {
        if (controller.signal.aborted) return;
        if (response.success && response.data) {
          setPlan(response.data);
          setNotice(response.data.shortfallMessage);
          return;
        }
        setPlan(null);
        setNotice(response.error?.message ?? GENERIC_ERROR);
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setPlan(null);
        setNotice(GENERIC_ERROR);
      });
    return () => controller.abort();
  }, [committedRange, mood, focus, hasSource]);

  function commitRange() {
    setCommittedRange((previous) => (sameRange(previous, liveRange) ? previous : liveRange));
  }

  return (
    <section className="flex flex-col gap-4 mood-card rounded-3xl p-5 ring-1 ring-line">
      <h2 className="text-base font-semibold">Session plan</h2>
      <SessionLengthControl value={liveRange} onChange={setLiveRange} onCommit={commitRange} />
      <SessionPlanList
        plan={hasSource ? plan : null}
        notice={hasSource ? notice : PICK_SOURCE_NOTICE}
      />
    </section>
  );
}
