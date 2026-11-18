const SUBJECT = "Reset your Pal Buddy password";
const INTRO_TEXT = "Someone asked to reset the password for your Pal Buddy account.";
const LINK_LABEL = "Reset password";
const EXPIRY_TEXT = "This link works for 60 minutes and only once.";
const IGNORE_TEXT = "If this was not you, ignore this email. Your password stays the same.";

export type PasswordResetEmail = { subject: string; text: string; html: string };

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => HTML_ESCAPES[character]);
}

/**
 * Builds the reset email from the link alone (spec FR-012). It carries no password, account
 * details, or address, and the link is escaped for the HTML version.
 */
export function buildPasswordResetEmail({ url }: { url: string }): PasswordResetEmail {
  const text = [INTRO_TEXT, "", `Reset it here: ${url}`, "", EXPIRY_TEXT, IGNORE_TEXT].join("\n");
  const html = [
    `<p>${INTRO_TEXT}</p>`,
    `<p><a href="${escapeHtml(url)}">${LINK_LABEL}</a></p>`,
    `<p>${EXPIRY_TEXT}</p>`,
    `<p>${IGNORE_TEXT}</p>`,
  ].join("");
  return { subject: SUBJECT, text, html };
}
