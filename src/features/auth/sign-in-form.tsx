"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth/auth-client";

const GENERIC_SIGN_IN_ERROR =
  "We could not sign you in. Check your email and password and try again.";
const GENERIC_SIGN_UP_ERROR = "We could not create that account. Try a different email or sign in.";
const AFTER_SIGN_IN_PATH = "/";

type Mode = "sign-in" | "sign-up";

/** Email and password sign-in, with a toggle to create an account. Errors never reveal whether an email exists. */
export function SignInForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("sign-in");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");
    const name = String(form.get("name") ?? "");
    setPending(true);
    setError(null);
    const result =
      mode === "sign-in"
        ? await authClient.signIn.email({ email, password })
        : await authClient.signUp.email({ email, password, name });
    setPending(false);
    if (result.error) {
      setError(mode === "sign-in" ? GENERIC_SIGN_IN_ERROR : GENERIC_SIGN_UP_ERROR);
      return;
    }
    router.replace(AFTER_SIGN_IN_PATH);
    router.refresh();
  }

  const isSignUp = mode === "sign-up";
  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-3 text-left">
      {isSignUp ? (
        <label className="flex flex-col gap-1">
          <span>Your name</span>
          <input
            name="name"
            type="text"
            required
            autoComplete="name"
            className="rounded-md px-3 py-2"
          />
        </label>
      ) : null}
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
      <div className="relative flex flex-col gap-1">
        <label className="flex flex-col gap-1">
          <span>Password</span>
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            required
            minLength={8}
            autoComplete={isSignUp ? "new-password" : "current-password"}
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
        {isSignUp ? "Create account" : "Sign in"}
      </button>
      <button
        type="button"
        onClick={() => setMode(isSignUp ? "sign-in" : "sign-up")}
        className="text-sm underline underline-offset-4"
      >
        {isSignUp ? "I already have an account" : "Create an account"}
      </button>
    </form>
  );
}
