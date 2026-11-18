import { describe, expect, it } from "vitest";
import { createResendSender, RESEND_EMAILS_URL } from "@/features/auth/password-reset-sender";

const API_KEY = "re_secret_test_key";
const EMAIL = {
  to: "reader@example.test",
  from: "no-reply@pal-buddy.eu",
  subject: "Reset your Pal Buddy password",
  text: "Reset it here: https://www.pal-buddy.eu/reset-password?token=abc",
  html: "<p>Reset</p>",
};

function fakeFetch(status: number) {
  const calls: { url: string; init: RequestInit }[] = [];
  const fetcher = async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init: init ?? {} });
    return new Response(JSON.stringify({ id: "email-1" }), { status });
  };
  return { calls, fetcher: fetcher as typeof fetch };
}

describe("createResendSender", () => {
  it("posts the email to the Resend emails endpoint with the API key as a bearer token", async () => {
    // Arrange
    const { calls, fetcher } = fakeFetch(200);
    const sender = createResendSender({ apiKey: API_KEY, fetcher });

    // Act
    await sender.send(EMAIL);

    // Assert
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe(RESEND_EMAILS_URL);
    expect(calls[0].init.method).toBe("POST");
    expect((calls[0].init.headers as Record<string, string>).Authorization).toBe(
      `Bearer ${API_KEY}`,
    );
  });

  it("sends the sender, recipient, subject, and both bodies in the request", async () => {
    // Arrange
    const { calls, fetcher } = fakeFetch(200);
    const sender = createResendSender({ apiKey: API_KEY, fetcher });

    // Act
    await sender.send(EMAIL);

    // Assert
    const body = JSON.parse(String(calls[0].init.body));
    expect(body).toEqual({
      from: EMAIL.from,
      to: [EMAIL.to],
      subject: EMAIL.subject,
      text: EMAIL.text,
      html: EMAIL.html,
    });
  });

  it("throws with the status code when the provider refuses the email", async () => {
    // Arrange
    const { fetcher } = fakeFetch(422);
    const sender = createResendSender({ apiKey: API_KEY, fetcher });

    // Act / Assert
    await expect(sender.send(EMAIL)).rejects.toThrow(/422/);
  });

  it("never puts the API key or the recipient address in the error message", async () => {
    // Arrange
    const { fetcher } = fakeFetch(500);
    const sender = createResendSender({ apiKey: API_KEY, fetcher });

    // Act
    const failure = await sender.send(EMAIL).catch((error: unknown) => error);

    // Assert
    expect(String(failure)).not.toContain(API_KEY);
    expect(String(failure)).not.toContain(EMAIL.to);
  });
});
