"use client";

import { useState } from "react";

const CONSENT_ENDPOINT = "/api/auth/oauth2/consent";
const CONSENT_ERROR = "Something went wrong. Go back to the app and try connecting again.";

/**
 * Approve or cancel an app's request for access. The signed query string of the consent page is
 * posted back exactly as the browser shows it, because Better Auth verifies its signature.
 */
export function ConsentForm() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function respond(accept: boolean) {
    setPending(true);
    setError(null);
    const oauthQuery = window.location.search.slice(1);
    const response = await fetch(CONSENT_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ accept, oauth_query: oauthQuery }),
    });
    const body = (await response.json().catch(() => null)) as { url?: string } | null;
    if (!response.ok || !body?.url) {
      setPending(false);
      setError(CONSENT_ERROR);
      return;
    }
    window.location.href = body.url;
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        disabled={pending}
        onClick={() => respond(true)}
        className="rounded-full bg-accent px-6 py-3 text-base font-semibold text-on-accent disabled:opacity-60"
      >
        Approve
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => respond(false)}
        className="rounded-full px-6 py-3 text-base underline underline-offset-4 disabled:opacity-60"
      >
        Cancel
      </button>
      {error ? (
        <p role="alert" className="text-sm">
          {error}
        </p>
      ) : null}
    </div>
  );
}
