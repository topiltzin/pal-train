import type { Page } from "@playwright/test";

const E2E_EMAIL = process.env.E2E_USER_EMAIL;
const E2E_PASSWORD = process.env.E2E_USER_PASSWORD;

export const hasE2eCredentials = Boolean(E2E_EMAIL && E2E_PASSWORD);

export const SKIP_REASON =
  "Set E2E_USER_EMAIL and E2E_USER_PASSWORD (a test user in the Auth0 dev tenant) to run signed-in e2e tests.";

/**
 * Signs in through the Auth0 Universal Login page started by the sign-in button.
 * Selectors follow Auth0's default login form; adjust if the tenant uses a custom login page.
 */
export async function signIn(page: Page): Promise<void> {
  if (!E2E_EMAIL || !E2E_PASSWORD) {
    throw new Error(SKIP_REASON);
  }
  await page.goto("/sign-in");
  await page.getByRole("link", { name: "Sign in to get started" }).click();
  await page.locator('input[name="username"], input[name="email"]').first().fill(E2E_EMAIL);
  await page.locator('input[name="password"]').first().fill(E2E_PASSWORD);
  await page.locator('button[type="submit"], button[name="action"]').first().click();
  await page.getByText(/^Hi, /).waitFor();
}
