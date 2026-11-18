import Link from "next/link";
import { ForgotPasswordForm } from "@/features/auth/forgot-password-form";

const PAGE_CLASS =
  "flex min-h-[100dvh] flex-col items-center justify-center gap-6 px-4 py-10 text-center";

/** Asks for a reset link. The page gives the same confirmation for every address (spec FR-003). */
export default function ForgotPasswordPage() {
  return (
    <main className={PAGE_CLASS}>
      <h1 className="text-3xl font-bold">Forgot your password?</h1>
      <p className="max-w-sm text-base">
        Enter the email address for your account and we&apos;ll send you a link to choose a new
        password.
      </p>
      <ForgotPasswordForm />
      <Link href="/sign-in" className="text-sm underline underline-offset-4">
        Back to sign in
      </Link>
    </main>
  );
}
