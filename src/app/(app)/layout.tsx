import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense, type ReactNode } from "react";
import { getCurrentUser } from "@/features/auth/session";
import { upsertUser } from "@/features/auth/user-repository";

async function AuthenticatedShell({ children }: { children: ReactNode }) {
  await connection();
  const claims = await getCurrentUser();
  if (!claims) {
    redirect("/sign-in");
  }
  const user = await upsertUser(claims);
  return (
    <div className="flex min-h-screen flex-col">
      <header className="px-4 py-4 text-lg font-semibold">Hi, {user.displayName}!</header>
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
