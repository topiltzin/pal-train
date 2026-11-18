import { describe, expect, it } from "vitest";
import { buildPasswordResetEmail } from "@/features/auth/password-reset-email";

const RESET_URL = "https://www.pal-buddy.eu/reset-password?token=abc123";

describe("buildPasswordResetEmail", () => {
  it("uses the reset subject", () => {
    // Arrange, Act
    const email = buildPasswordResetEmail({ url: RESET_URL });

    // Assert
    expect(email.subject).toBe("Reset your Pal Buddy password");
  });

  it("includes the reset link and the 60-minute, single-use rule in the text", () => {
    // Arrange, Act
    const email = buildPasswordResetEmail({ url: RESET_URL });

    // Assert
    expect(email.text).toContain(RESET_URL);
    expect(email.text).toContain("60 minutes");
    expect(email.text).toContain("once");
  });

  it("tells the reader to ignore the email if they did not ask for it", () => {
    // Arrange, Act
    const email = buildPasswordResetEmail({ url: RESET_URL });

    // Assert
    expect(email.text.toLowerCase()).toContain("if this was not you");
  });

  it("contains no email address or password field, since it is built from the link alone", () => {
    // Arrange, Act
    const email = buildPasswordResetEmail({ url: RESET_URL });

    // Assert
    expect(email.text).not.toMatch(/@/);
    expect(email.html).not.toMatch(/@/);
    expect(email.text.toLowerCase()).not.toContain("newpassword");
  });

  it("escapes the link in the HTML so it cannot inject markup", () => {
    // Arrange
    const hostile = 'https://example.test/reset?x="><script>alert(1)</script>';

    // Act
    const email = buildPasswordResetEmail({ url: hostile });

    // Assert
    expect(email.html).not.toContain("<script>");
    expect(email.html).toContain("&quot;");
  });
});
