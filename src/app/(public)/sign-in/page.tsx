import Image from "next/image";
import { connection } from "next/server";
import { Suspense } from "react";
import { SignInForm } from "@/features/auth/sign-in-form";
import { pickRandomMood } from "@/features/moods/random-mood";

const STICKER_PX = 176;

/** A different mood sticker on each visit. It renders at request time, behind a Suspense boundary. */
async function RandomMoodSticker() {
  await connection();
  const mood = pickRandomMood();
  return (
    <Image
      src={`/moods/${mood.id}.png`}
      alt={`${mood.label} mood sticker`}
      width={STICKER_PX}
      height={STICKER_PX}
      priority
    />
  );
}

export default function SignInPage() {
  return (
    <main
      className="relative flex min-h-[100dvh] flex-col items-center justify-center gap-6 overflow-hidden px-4 py-10 text-center"
      style={{
        background: "linear-gradient(180deg, var(--surface-raised) 0%, var(--background) 60%)",
      }}
    >
      <Suspense fallback={<div aria-hidden style={{ width: STICKER_PX, height: STICKER_PX }} />}>
        <RandomMoodSticker />
      </Suspense>
      <h1 className="text-3xl font-bold">Hey, I&apos;m your gym buddy</h1>
      <p className="max-w-sm text-base">
        Tell me how you feel today and I&apos;ll throw a few workout ideas your way. No coaching, no
        plans, just friendly suggestions.
      </p>
      <SignInForm />
    </main>
  );
}
