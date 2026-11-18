import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { ResetPasswordForm } from "@/features/auth/reset-password-form";

type ResetSearch = Promise<{ token?: string; error?: string }>;

const INVALID_TOKEN = "INVALID_TOKEN";
const PAGE_CLASS =
  "flex min-h-[100dvh] flex-col items-center justify-center gap-6 px-4 py-10 text-center";

/** The part of the page that depends on the request: the token in the link and any error it carries. */
async function ResetContent({ searchParams }: { searchParams: ResetSearch }) {
  await connection();
  const { token, error } = await searchParams;
  if (!token || error === INVALID_TOKEN) {
    return (
      <>
        <h1 className="text-3xl font-bold">This link is no longer valid.</h1>
        <p className="max-w-sm text-base">
          Reset links work once and expire after 60 minutes. You can ask for a new one.
        </p>
        <Link href="/forgot-password" className="underline underline-offset-4">
          Request a new link
        </Link>
      </>
    );
  }
  return (
    <>
      <h1 className="text-3xl font-bold">Choose a new password</h1>
      <ResetPasswordForm token={token} />
    </>
  );
}

/** The new-password page. A link that is missing its token, or that Better Auth rejected, gets the no-longer-valid view. */
export default function ResetPasswordPage({ searchParams }: { searchParams: ResetSearch }) {
  return (
    <main className={PAGE_CLASS}>
      <Suspense fallback={<div aria-hidden className="h-40 w-full max-w-sm" />}>
        <ResetContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
