import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pal Buddy for ChatGPT",
  description: "What the Pal Buddy connector reads, shares, and how to disconnect it.",
};

/** Public description of the connector, for review and for users (spec FR-014). */
export default function OpenAiConnectorPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-10 md:max-w-2xl">
      <h1 className="text-2xl font-bold">Pal Buddy for ChatGPT</h1>
      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">What it does</h2>
        <p>
          Lets you ask ChatGPT for a workout from Pal Buddy: pick a mood, a focus area, and a
          length, and get the same plan the app makes. It can also list the focus areas and
          exercises.
        </p>
      </section>
      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">What it reads</h2>
        <p>
          Your display name, and the plans and exercise library content it returns to you. It can
          read these only to answer your requests.
        </p>
      </section>
      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">What it does not read</h2>
        <p>
          Your email address, your sign-in identifier, your mood history, and your password are
          never shared with ChatGPT.
        </p>
      </section>
      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Read only</h2>
        <p>
          The connector cannot change your data. It cannot save sessions, log workouts, or edit your
          mood history.
        </p>
      </section>
      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">How to disconnect</h2>
        <p>
          Open{" "}
          <a className="underline" href="/connections">
            Connected apps
          </a>{" "}
          in Pal Buddy and choose Disconnect. ChatGPT loses access on its next request, within one
          minute.
        </p>
      </section>
    </main>
  );
}
