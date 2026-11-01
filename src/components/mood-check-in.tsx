"use client";

import { ArrowRight } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";
import { useId, useState, type FormEvent } from "react";
import type { Mood, MoodId } from "@/features/moods/moods";
import { inferMoodFromText } from "@/features/pal/infer-mood";

type MoodCheckInProps = {
  moods: readonly Mood[];
  onMood: (mood: MoodId) => void;
};

const EMPTY_REPLY = "Type a few words and I'll read the vibe.";
const NO_MATCH_REPLY = "I didn't catch a mood in that. Tap one below and we're off.";

function matchReply(mood: Mood): string {
  return `Sounds like ${mood.label.toLowerCase()} to me. Here's what I'd pick.`;
}

export function MoodCheckIn({ moods, onMood }: MoodCheckInProps) {
  const [text, setText] = useState("");
  const [reply, setReply] = useState<string | null>(null);
  const inputId = useId();
  const replyId = useId();
  const reduce = useReducedMotion();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (text.trim() === "") {
      setReply(EMPTY_REPLY);
      return;
    }
    const mood = inferMoodFromText(text);
    const matched = moods.find((candidate) => candidate.id === mood);
    if (!matched) {
      setReply(NO_MATCH_REPLY);
      return;
    }
    setReply(matchReply(matched));
    onMood(matched.id);
  }

  return (
    <div className="flex flex-col gap-3">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <label htmlFor={inputId} className="text-sm font-semibold">
          How do you feel?
        </label>
        <div className="flex items-center gap-2 rounded-full border-2 border-black/15 bg-white p-1.5 pl-4 focus-within:border-black">
          <input
            id={inputId}
            name="checkin"
            type="text"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="So tired after work"
            autoComplete="off"
            aria-describedby={replyId}
            className="min-w-0 flex-1 bg-transparent py-2 text-base outline-none placeholder:text-black/40"
          />
          <button
            type="submit"
            className="flex items-center gap-1 rounded-full bg-[#14161f] px-4 py-2 text-sm font-semibold text-white transition-transform duration-150 ease-out hover:bg-black active:scale-[0.97]"
          >
            Ask Pip
            <ArrowRight size={16} weight="bold" aria-hidden />
          </button>
        </div>
      </form>
      <div id={replyId} aria-live="polite" className="min-h-6 text-sm">
        {reply ? (
          <motion.p
            key={reply}
            initial={reduce ? false : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
          >
            {reply}
          </motion.p>
        ) : null}
      </div>
    </div>
  );
}
