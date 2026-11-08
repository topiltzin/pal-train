import type { Metadata } from "next";
import { SUPPORT_EMAIL } from "@/features/mcp/support-contact";

export const metadata: Metadata = {
  title: "Privacy policy · Pal Buddy",
  description:
    "What Pal Buddy collects, why, who receives it, how long it is kept, and your controls.",
};

const LAST_UPDATED = "8 November 2026";

const SECTIONS = [
  { id: "collect", label: "What we collect" },
  { id: "why", label: "Why we use it" },
  { id: "receive", label: "Who receives it" },
  { id: "tracking", label: "Tracking and analytics" },
  { id: "keep", label: "How long we keep it" },
  { id: "not-collected", label: "What we do not collect" },
  { id: "audience", label: "Who can use Pal Buddy" },
  { id: "choices", label: "Your choices" },
  { id: "changes", label: "Changes" },
  { id: "contact", label: "Contact" },
] as const;

const COLLECTED = [
  {
    term: "Account",
    detail:
      "Your display name, your email address, and an internal account identifier. Sign-in is handled by Auth0, which holds your login credentials. We never see your password.",
  },
  {
    term: "Connector approvals",
    detail:
      "The name of each connected app, when you approved it, when it was last used, and whether you disconnected it.",
  },
  {
    term: "Connector audit records",
    detail:
      "The kind of event (for example a request accepted, refused, or limited), a time stamp, the internal account identifier, the connected app, and a short reason code. They never hold access tokens, authorization codes, email addresses, names, or mood values.",
  },
  {
    term: "Request counts",
    detail:
      "How many connector requests your account made in the current minute, used to limit how often a connector can ask.",
  },
  {
    term: "Workout requests",
    detail:
      "The mood, focus area, and session length you choose, and the workouts we return.",
  },
];

const HEADING = "text-xl font-semibold tracking-tight md:text-2xl";
const SECTION = "flex flex-col gap-4 border-t border-line pt-8";
const BODY_LIST = "flex list-disc flex-col gap-2 pl-5";

/** Published privacy policy, linked from the ChatGPT connector (OpenAI plugin guidelines). */
export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-[65ch] px-4 py-10 md:py-16">
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Privacy policy</h1>
        <p className="text-muted">Last updated {LAST_UPDATED}.</p>
        <p className="text-lg leading-relaxed">
          This policy covers the Pal Buddy web app and the Pal Buddy connector for ChatGPT. It
          explains what we collect, why, who receives it, how long we keep it, and what you can do
          about it.
        </p>
      </header>

      <nav aria-label="On this page" className="mt-8 border-t border-line pt-6">
        <p className="mb-3 text-sm font-semibold uppercase text-muted">On this page</p>
        <ul className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
          {SECTIONS.map((section) => (
            <li key={section.id}>
              <a
                className="underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-accent"
                href={`#${section.id}`}
              >
                {section.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-10 flex flex-col gap-10">
        <section id="collect" className={SECTION}>
          <h2 className={HEADING}>What we collect</h2>
          <dl className="flex flex-col gap-6">
            {COLLECTED.map((item) => (
              <div key={item.term} className="flex flex-col gap-1">
                <dt className="font-semibold">{item.term}</dt>
                <dd className="text-muted">{item.detail}</dd>
              </div>
            ))}
          </dl>
          <p>We collect only what these features need. We do not ask for anything beyond that.</p>
        </section>

        <section id="why" className={SECTION}>
          <h2 className={HEADING}>Why we use it</h2>
          <ul className={BODY_LIST}>
            <li>To sign you in and keep your account working.</li>
            <li>To plan the workouts you ask for, in the app or through the connector.</li>
            <li>
              To limit how often a connector can ask, and to keep a record of access to your
              account.
            </li>
            <li>To show you which apps are connected and let you disconnect them.</li>
          </ul>
          <p>We do not use this information for advertising or for profiling you.</p>
        </section>

        <section id="receive" className={SECTION}>
          <h2 className={HEADING}>Who receives it</h2>
          <ul className={BODY_LIST}>
            <li>
              <strong>Auth0</strong> runs sign-in and issues the access tokens that connectors use.
            </li>
            <li>
              <strong>Our database and hosting providers</strong> store and serve the app. Neon
              stores the data and Vercel hosts the app.
            </li>
            <li>
              <strong>OpenAI</strong> receives only the workout plans and exercise library content
              it asks for on your behalf. It never receives your email address, your sign-in
              identifier, or your password.
            </li>
          </ul>
          <p>We do not sell your data.</p>
        </section>

        <section id="tracking" className={SECTION}>
          <h2 className={HEADING}>Tracking and analytics</h2>
          <p>
            The connector uses no cookies and no cross-site tracking. Its time stamps and request
            counts exist only for security and the per-minute limit, and they are not used to build a
            profile of you. The web app&apos;s analytics are self-hosted, cookie-free, and count page
            views and named product actions. They do not include your email address, your name, or
            your mood.
          </p>
        </section>

        <section id="keep" className={SECTION}>
          <h2 className={HEADING}>How long we keep it</h2>
          <ul className={BODY_LIST}>
            <li>
              <strong>Connector approvals:</strong> until you disconnect the app. A disconnected
              approval is kept as a removed record until you delete your account.
            </li>
            <li>
              <strong>Audit records:</strong> kept for 90 days, then deleted.
            </li>
            <li>
              <strong>Request counts:</strong> kept for the current minute only.
            </li>
            <li>
              <strong>Account data:</strong> kept while your account exists. Deleting your account
              removes it.
            </li>
          </ul>
        </section>

        <section id="not-collected" className={SECTION}>
          <h2 className={HEADING}>What we do not collect</h2>
          <p>
            We do not collect payment card data, protected health information, government
            identifiers such as social security numbers, or access credentials such as passwords, API
            keys, or one-time codes. Pal Buddy is a general fitness idea tool, not a medical service.
            The mood you choose is a label for the kind of workout you want, not a health record.
          </p>
        </section>

        <section id="audience" className={SECTION}>
          <h2 className={HEADING}>Who can use Pal Buddy</h2>
          <p>
            Pal Buddy is for a general audience, including people aged 13 to 17. It is not directed
            at children under 13, and we do not knowingly collect information from them.
          </p>
        </section>

        <section id="choices" className={SECTION}>
          <h2 className={HEADING}>Your choices</h2>
          <ul className={BODY_LIST}>
            <li>
              <strong>Disconnect any connected app</strong> from Connected apps in Pal Buddy. The app
              loses access on its next request.
            </li>
            <li>
              <strong>Ask for a copy of your data, or for your data to be deleted,</strong> by
              writing to the support address below. We reply within the time required by law.
            </li>
          </ul>
        </section>

        <section id="changes" className={SECTION}>
          <h2 className={HEADING}>Changes to this policy</h2>
          <p>
            When we change this policy we update the date above. For material changes we tell you in
            the app before they take effect.
          </p>
        </section>

        <section id="contact" className={SECTION}>
          <h2 className={HEADING}>Contact</h2>
          <p>
            Questions, support, and privacy requests:{" "}
            <a
              className="font-medium text-accent underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-accent"
              href={`mailto:${SUPPORT_EMAIL}`}
            >
              {SUPPORT_EMAIL}
            </a>
          </p>
        </section>
      </div>
    </main>
  );
}
