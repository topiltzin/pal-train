import type { Page } from "@playwright/test";

const E2E_EMAIL = process.env.E2E_USER_EMAIL;
const E2E_PASSWORD = process.env.E2E_USER_PASSWORD;

export const hasE2eCredentials = Boolean(E2E_EMAIL && E2E_PASSWORD);

export const SKIP_REASON =
  "Set E2E_USER_EMAIL and E2E_USER_PASSWORD (a test user created in Pal Buddy) to run signed-in e2e tests.";

/** Signs in with email and password on Pal Buddy's own sign-in page (feature 010). */
export async function signIn(page: Page): Promise<void> {
  if (!E2E_EMAIL || !E2E_PASSWORD) {
    throw new Error(SKIP_REASON);
  }
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(E2E_EMAIL);
  await page.getByLabel("Password", { exact: true }).fill(E2E_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.getByText(/^Hi, /).waitFor();
}
