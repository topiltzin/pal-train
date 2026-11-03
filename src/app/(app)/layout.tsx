import { SignOut } from "@phosphor-icons/react/ssr";
import Image from "next/image";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense, type ReactNode } from "react";
import { getCurrentUser } from "@/features/auth/session";
import { upsertUser } from "@/features/auth/user-repository";

// Auth0 SDK route, handled by the middleware. A plain link, not client routing, so the session is cleared.
const LOGOUT_HREF = "/auth/logout";
const PIP_AVATAR_SRC = "/pal/buddy.png";

async function AuthenticatedShell({ children }: { children: ReactNode }) {
  await connection();
  const claims = await getCurrentUser();
  if (!claims) {
    redirect("/sign-in");
  }
  const user = await upsertUser(claims);
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-line">
        <div className="mx-auto flex w-full max-w-md items-center justify-between gap-3 px-4 py-3 md:max-w-3xl">
          <div className="flex min-w-0 items-center gap-3">
            <span className="relative size-11 shrink-0 overflow-hidden rounded-full bg-surface ring-1 ring-line">
              <Image
                src={PIP_AVATAR_SRC}
                alt=""
                fill
                sizes="44px"
                className="object-cover"
                style={{ objectPosition: "50% 20%", transform: "scale(1.3)" }}
              />
            </span>
            <div className="min-w-0">
              <p className="truncate text-base font-semibold leading-tight">
                Hi, {user.displayName}!
              </p>
              <p className="text-sm leading-tight text-muted">Pal Buddy</p>
            </div>
          </div>
          <a
            href={LOGOUT_HREF}
            className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border-2 border-line bg-surface px-4 text-sm font-semibold text-foreground transition-[border-color,transform] duration-150 ease-out hover:border-muted motion-safe:active:scale-[0.97]"
          >
            <SignOut size={16} weight="bold" aria-hidden className="shrink-0" />
            Log out
          </a>
        </div>
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
