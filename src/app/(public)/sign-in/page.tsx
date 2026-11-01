import { Pip } from "@/components/pal/pip";

export default function SignInPage() {
  return (
    <main
      className="relative flex min-h-[100dvh] flex-col items-center justify-center gap-6 overflow-hidden px-4 py-10 text-center"
      style={{ background: "linear-gradient(180deg, #dff1ff 0%, var(--background) 60%)" }}
    >
      <Pip expression="happy" accent="var(--color-accent-sky)" label="happy" sizePx={176} />
      <h1 className="text-3xl font-bold">Hey, I&apos;m your gym buddy</h1>
      <p className="max-w-sm text-base">
        Tell me how you feel today and I&apos;ll throw a few workout ideas your way. No coaching, no
        plans, just friendly suggestions.
      </p>
      <a
        href="/auth/login?returnTo=/"
        className="rounded-full bg-[#14161f] px-6 py-3 text-base font-semibold text-white transition-transform duration-150 ease-out active:scale-[0.97]"
      >
        Sign in to get started
      </a>
    </main>
  );
}
