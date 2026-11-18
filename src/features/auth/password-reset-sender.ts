export const RESEND_EMAILS_URL = "https://api.resend.com/emails";

export type ResetEmailMessage = {
  to: string;
  from: string;
  subject: string;
  text: string;
  html: string;
};

/** Anything that can deliver a reset email. The reset flow depends on this, not on a provider. */
export interface PasswordResetSender {
  send(message: ResetEmailMessage): Promise<void>;
}

type Fetcher = typeof fetch;

/**
 * Sends through Resend's HTTP API. Failures name only the status code: the error must never carry
 * the API key or the recipient's address, because errors reach the logs.
 */
export function createResendSender({
  apiKey,
  fetcher = fetch,
}: {
  apiKey: string;
  fetcher?: Fetcher;
}): PasswordResetSender {
  return {
    async send(message) {
      const response = await fetcher(RESEND_EMAILS_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: message.from,
          to: [message.to],
          subject: message.subject,
          text: message.text,
          html: message.html,
        }),
      });
      if (!response.ok) {
        throw new Error(`Resend refused the password reset email with status ${response.status}`);
      }
    },
  };
}
