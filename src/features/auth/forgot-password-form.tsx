"use client";

import { useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth/auth-client";

const CONFIRMATION =
  "If an account exists for that address, we've sent a link to reset the password.";
const RESET_PATH = "/reset-password";

/**
 * Asks for a reset link. The same confirmation is shown whatever the outcome, so the page never
 * reveals whether an address has an account (spec FR-003). A failed request is still logged on
 * the server; the visitor is not told, for the same reason.
 */
export function ForgotPasswordForm() {
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email") ?? "");
    setPending(true);
    try {
      await authClient.requestPasswordReset({
        email,
        redirectTo: `${window.location.origin}${RESET_PATH}`,
      });
    } finally {
      setPending(false);
      setSent(true);
    }
  }

  if (sent) {
    return (
      <p role="status" className="max-w-sm text-base">
        {CONFIRMATION}
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-3 text-left">
      <label className="flex flex-col gap-1">
        <span>Email</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="rounded-md px-3 py-2"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-accent px-6 py-3 text-base font-semibold text-on-accent disabled:opacity-60"
      >
        Send reset link
      </button>
    </form>
  );
}
