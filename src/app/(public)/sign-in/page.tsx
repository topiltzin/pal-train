export default function SignInPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-10 text-center">
      <h1 className="text-3xl font-bold">Hey, I&apos;m your gym buddy</h1>
      <p className="max-w-sm text-base">
        Tell me how you feel today and I&apos;ll throw a few workout ideas your way. No coaching, no
        plans, just friendly suggestions.
      </p>
      <a
        href="/auth/login?returnTo=/"
        className="rounded-full bg-black px-6 py-3 text-base font-semibold text-white"
      >
        Sign in to get started
      </a>
    </main>
  );
}
