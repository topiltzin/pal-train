import type { Metadata } from "next";
import { SUPPORT_EMAIL } from "@/features/mcp/support-contact";

const EXAMPLE_PROMPTS = [
  "Plan a 30-minute legs workout for a tired day.",
  "What focus areas can you plan for?",
  "Show me the chest exercises in Pal Buddy.",
  "Give me a 45-minute full-body session for an energized mood.",
];

export const metadata: Metadata = {
  title: "Pal Buddy for ChatGPT",
  description: "What the Pal Buddy connector does, what it reads, and how to disconnect it.",
};

const HEADING = "text-xl font-semibold tracking-tight md:text-2xl";
const SECTION = "flex flex-col gap-4 border-t border-line pt-8";
const BODY_LIST = "flex list-disc flex-col gap-2 pl-5";
const LINK =
  "font-medium text-accent underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-accent";

/** Public description of the connector, for users and for review (spec FR-014). */
export default function OpenAiConnectorPage() {
  return (
    <main className="mx-auto w-full max-w-[65ch] px-4 py-10 md:py-16">
      <header className="flex flex-col gap-4">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Pal Buddy for ChatGPT</h1>
        <p className="text-lg leading-relaxed text-muted">
          Ask ChatGPT for a workout from Pal Buddy. Tell it a mood, a focus area, and a length, and
          get the same plan the app makes.
        </p>
        <div>
          <a
            href="/connections"
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-accent px-6 text-sm font-semibold text-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Manage connected apps
          </a>
        </div>
      </header>

      <div className="mt-10 flex flex-col gap-10">
        <section className={SECTION}>
          <h2 className={HEADING}>What it does</h2>
          <p>
            Pal Buddy for ChatGPT lets you ask for a workout from Pal Buddy. Tell ChatGPT a mood, a
            focus area, and a length from 10 to 90 minutes, and it returns the same plan the Pal
            Buddy app makes, with each exercise&apos;s minutes, equipment, and caution notes. You
            can also browse the focus areas and the exercises in each one.
          </p>
        </section>

        <section className={SECTION}>
          <h2 className={HEADING}>Try asking</h2>
          <ul className="flex flex-col gap-3">
            {EXAMPLE_PROMPTS.map((prompt) => (
              <li key={prompt} className="border-l-2 border-accent pl-4">
                {prompt}
              </li>
            ))}
          </ul>
        </section>

        <section className={SECTION}>
          <h2 className={HEADING}>What it can do</h2>
          <ul className={BODY_LIST}>
            <li>List the focus areas.</li>
            <li>List the exercises in one focus area.</li>
            <li>Plan a workout for a mood, a focus area, or both, for a chosen length.</li>
          </ul>
          <p>
            Every action is read-only. The connector cannot save sessions, log workouts, change your
            mood history, or change anything in your account.
          </p>
        </section>

        <section className={SECTION}>
          <h2 className={HEADING}>What it reads and shares</h2>
          <p>
            The connector reads your request (the mood, focus area, and length you ask for) and
            returns the workout plan or library content that answers it. It uses an internal account
            identifier to find your connection and apply the per-minute limit. It does not read or
            share your name, your email address, your sign-in identifier, your password, or your
            mood history.
          </p>
        </section>

        <section className={SECTION}>
          <h2 className={HEADING}>Sign-in and permissions</h2>
          <p>
            You sign in with Auth0, the same account system as Pal Buddy, not inside ChatGPT. Auth0
            then shows a consent screen that names the app and lists the two permissions it asks
            for: reading workout plans and reading the focus areas and exercises. The connector gets
            no other permission.
          </p>
        </section>

        <section className={SECTION}>
          <h2 className={HEADING}>How to disconnect</h2>
          <p>
            Open{" "}
            <a className={LINK} href="/connections">
              Connected apps
            </a>{" "}
            in Pal Buddy and choose Disconnect. ChatGPT loses access on its next request, within one
            minute.
          </p>
        </section>

        <section className={SECTION}>
          <h2 className={HEADING}>Privacy and support</h2>
          <p>
            Read the{" "}
            <a className={LINK} href="/privacy">
              privacy policy
            </a>
            . Questions, help, and privacy requests:{" "}
            <a className={LINK} href={`mailto:${SUPPORT_EMAIL}`}>
              {SUPPORT_EMAIL}
            </a>
          </p>
        </section>
      </div>
    </main>
  );
}
