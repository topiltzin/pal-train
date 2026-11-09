import { connection } from "next/server";
import { Suspense } from "react";
import { ConsentForm } from "@/features/auth/consent-form";

export const metadata = {
  title: "Allow access to Pal Buddy",
  description: "Approve or cancel an app's request to use your Pal Buddy workouts.",
};

/** What each requested scope lets the app read, in plain language (spec FR-007, FR-014). */
const SCOPE_DESCRIPTIONS: Record<string, string> = {
  "plans:read": "Read the workout plans Pal Buddy makes for you",
  "library:read": "Read the exercise library",
  openid: "Confirm who you are",
  profile: "Your display name",
  offline_access: "Stay connected until you disconnect the app",
};

const SHARED_NEVER = "Your email address, your password, and your mood history are never shared.";

type ConsentSearch = Promise<{ scope?: string }>;

/** Turns the space-separated scope parameter into plain-language lines the user can read. */
function describeScopes(scope: string | undefined): string[] {
  const requested = (scope ?? "").split(" ").filter(Boolean);
  const lines = requested.flatMap((name) =>
    SCOPE_DESCRIPTIONS[name] ? [SCOPE_DESCRIPTIONS[name]] : [],
  );
  return [...new Set(lines)];
}

/** The part of the page that depends on the request: which scopes the app asks for. */
async function ScopeList({ searchParams }: { searchParams: ConsentSearch }) {
  await connection();
  const { scope } = await searchParams;
  const lines = describeScopes(scope);
  return (
    <>
      <ul className="flex list-disc flex-col gap-2 pl-5">
        {lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </>
  );
}

export default function ConsentPage({ searchParams }: { searchParams: ConsentSearch }) {
  return (
    <main className="mx-auto flex w-full max-w-[65ch] flex-col gap-6 px-4 py-10 md:py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Allow access to Pal Buddy?</h1>
      <p className="text-lg leading-relaxed">
        An app is asking to use your Pal Buddy account. If you approve, it will be able to:
      </p>
      <Suspense fallback={<p>Loading the requested permissions…</p>}>
        <ScopeList searchParams={searchParams} />
      </Suspense>
      <p className="text-sm">{SHARED_NEVER}</p>
      <p className="text-sm">
        It cannot change your data. You can disconnect it at any time from your connected apps.
      </p>
      <ConsentForm />
    </main>
  );
}
