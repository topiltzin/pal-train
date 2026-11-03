import { SignOut } from "@phosphor-icons/react/ssr";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense, type ReactNode } from "react";
import { getCurrentUser } from "@/features/auth/session";
import { upsertUser } from "@/features/auth/user-repository";

// Auth0 SDK route, handled by the middleware. A plain link, not client routing, so the session is cleared.
const LOGOUT_HREF = "/auth/logout";

async function AuthenticatedShell({ children }: { children: ReactNode }) {
  await connection();
  const claims = await getCurrentUser();
  if (!claims) {
    redirect("/sign-in");
  }
  const user = await upsertUser(claims);
  return (
    <div className="flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-md items-center justify-between gap-3 px-4 py-4 md:max-w-3xl">
        <p className="min-w-0 truncate text-lg font-semibold">Hi, {user.displayName}!</p>
        <a
          href={LOGOUT_HREF}
          className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border-2 border-black/15 bg-white px-4 text-sm font-semibold text-black transition-[border-color,transform] duration-150 ease-out hover:border-black/40 motion-safe:active:scale-[0.97]"
        >
          <SignOut size={16} weight="bold" aria-hidden className="shrink-0" />
          Log out
        </a>
      </header>
      {children}
    </div>
  );
}

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<p className="px-4 py-6">Loading…</p>}>
      <AuthenticatedShell>{children}</AuthenticatedShell>
    </Suspense>
  );
}
