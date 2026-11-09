export const metadata = {
  title: "Terms of service | Pal Buddy",
  description: "The terms for using Pal Buddy and its ChatGPT connector.",
};

const SUPPORT_EMAIL = "support@lv-prime.eu";

/** Terms for the Pal Buddy web app and its ChatGPT connector. Owner review is required before launch. */
export default function TermsPage() {
  return (
    <main className="mx-auto flex w-full max-w-[65ch] flex-col gap-6 px-4 py-10 md:py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Terms of service</h1>
      <p className="text-sm">Last updated: 9 November 2026</p>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">The service</h2>
        <p>
          Pal Buddy suggests workouts based on your mood, a muscle group, and how long you have. The
          ChatGPT connector gives the same suggestions inside ChatGPT, after you approve it.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">Not medical advice</h2>
        <p>
          Workouts are general fitness information, not medical advice. Stop if you feel pain or
          dizziness, and check with a doctor before starting a new programme.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">Your account</h2>
        <p>
          You are responsible for keeping your password private. You can disconnect the ChatGPT
          connector at any time from your connected apps.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">Read-only connector</h2>
        <p>
          The connector can read workout plans and the exercise library. It cannot change your data,
          and it never receives your email address or password.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">No guarantee</h2>
        <p>
          The service is provided as it is. We do not guarantee any particular result, and we are
          not liable for injury from following a workout.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">Contact</h2>
        <p>
          Questions about these terms:{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="underline">
            {SUPPORT_EMAIL}
          </a>
          . See also our{" "}
          <a href="/privacy" className="underline">
            privacy notice
          </a>
          .
        </p>
      </section>
    </main>
  );
}
