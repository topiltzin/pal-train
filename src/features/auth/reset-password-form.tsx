"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth/auth-client";

const DONE_TEXT = "Your password has been changed. Sign in with your new password.";
const GENERIC_ERROR = "We could not change your password. Try again in a moment.";
const INVALID_TOKEN_CODE = "INVALID_TOKEN";
const INVALID_LINK_URL = "/reset-password?error=INVALID_TOKEN";

type ResetPasswordFormProps = {
  /** The one-time token from the emailed link. */
  token: string;
};

/**
 * Sets a new password from an emailed link. A used, expired, or altered link moves the page to its
 * "no longer valid" view, which the server renders from the error parameter.
 */
export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const newPassword = String(new FormData(event.currentTarget).get("password") ?? "");
    setPending(true);
    setError(null);
    const result = await authClient.resetPassword({ newPassword, token });
    setPending(false);
    if (result.error) {
      if (result.error.code === INVALID_TOKEN_CODE) {
        router.replace(INVALID_LINK_URL);
        return;
      }
      setError(GENERIC_ERROR);
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-4">
        <p role="status" className="max-w-sm text-base">
          {DONE_TEXT}
        </p>
        <Link href="/sign-in" className="underline underline-offset-4">
          Go to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-3 text-left">
      <div className="relative flex flex-col gap-1">
        <label className="flex flex-col gap-1">
          <span>New password</span>
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            required
            minLength={8}
            autoComplete="new-password"
            className="rounded-md px-3 py-2 pr-16"
          />
        </label>
        <button
          type="button"
          onClick={() => setShowPassword((shown) => !shown)}
          aria-pressed={showPassword}
          aria-label={showPassword ? "Hide password" : "Show password"}
          className="absolute bottom-1.5 right-2 rounded px-2 py-1 text-sm underline underline-offset-4"
        >
          {showPassword ? "Hide" : "Show"}
        </button>
      </div>
      {error ? (
        <p role="alert" className="text-sm">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-accent px-6 py-3 text-base font-semibold text-on-accent disabled:opacity-60"
      >
        Change password
      </button>
    </form>
  );
}
