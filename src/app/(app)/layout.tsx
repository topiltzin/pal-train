import Image from "next/image";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense, type CSSProperties, type ReactNode } from "react";
import CardNav from "@/components/card-nav";
import { getCurrentUser } from "@/features/auth/session";
import { upsertUser } from "@/features/auth/user-repository";
import { appNavCards } from "@/features/navigation/app-nav-items";

const PIP_AVATAR_SRC = "/pal/buddy.png";
const LOGO_PX = 36;

/** Maps the menu's tokens onto the app's own theme, so the menu matches every screen. */
const APP_NAV_STYLE = {
  "--cn-panel": "color-mix(in srgb, var(--surface) 88%, transparent)",
  "--cn-solid": "var(--surface)",
  "--cn-edge": "var(--line)",
  "--cn-highlight": "rgb(255 255 255 / 0.06)",
  "--cn-shadow": "0 18px 40px -18px rgb(0 0 0 / 0.7)",
  "--cn-text": "var(--foreground)",
  "--cn-muted": "var(--muted)",
  "--cn-hover": "rgb(255 255 255 / 0.06)",
  "--cn-ring": "var(--accent)",
  "--cn-tile": "var(--surface-raised)",
  "--cn-tile-rim": "inset 0 0 0 1px var(--line)",
  "--cn-logo": `${LOGO_PX}px`,
} as CSSProperties;

function BrandMark() {
  return (
    <span className="flex items-center gap-2">
      <span
        className="relative block shrink-0 overflow-hidden rounded-full bg-surface ring-1 ring-line"
        style={{ width: LOGO_PX, height: LOGO_PX }}
      >
        <Image
          src={PIP_AVATAR_SRC}
          alt=""
          fill
          sizes={`${LOGO_PX}px`}
          className="object-cover"
          style={{ objectPosition: "50% 20%", transform: "scale(1.3)" }}
        />
      </span>
      <span className="text-sm font-semibold leading-tight">Pal Buddy</span>
    </span>
  );
}

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
        <div className="mx-auto w-full max-w-md px-4 py-2 md:max-w-3xl">
          <CardNav
            logo={<BrandMark />}
            logoAlt="Pal Buddy home"
            logoHref="/"
            items={appNavCards(user.displayName)}
            maxWidth={768}
            ariaLabel="Main"
            style={APP_NAV_STYLE}
          />
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
