import { expect, test, type BrowserContext } from "@playwright/test";
import { hasE2eCredentials, signIn, SKIP_REASON } from "./helpers/sign-in";
import {
  ANALYTICS_SKIP_REASON,
  analyticsE2eEnabled,
  installUmamiStub,
  recordedCalls,
} from "./helpers/umami-stub";

const E2E_EMAIL = process.env.E2E_USER_EMAIL ?? "";
const E2E_NAME_PATTERN = /^Hi, /;
const HEX_ID_PATTERN = /^[0-9a-f]{40}$/;

async function identifyValues(context: BrowserContext): Promise<string[]> {
  const page = context.pages()[0];
  const calls = await recordedCalls(page);
  return calls.filter((call) => call.type === "identify").map((call) => String(call.args[0]));
}

test.describe("signed-in identity, analytics on", () => {
  test.skip(!analyticsE2eEnabled, ANALYTICS_SKIP_REASON);
  test.skip(!hasE2eCredentials, SKIP_REASON);

  test("sends the same 40-character identifier from two browsers, and no personal data", async ({
    browser,
  }) => {
    // Arrange
    const first = await browser.newContext();
    const second = await browser.newContext();
    const firstPage = await first.newPage();
    const secondPage = await second.newPage();
    await installUmamiStub(firstPage);
    await installUmamiStub(secondPage);

    // Act
    await signIn(firstPage);
    await signIn(secondPage);

    // Assert
    const firstIds = await identifyValues(first);
    const secondIds = await identifyValues(second);
    expect(firstIds.length).toBeGreaterThan(0);
    expect(firstIds[0]).toMatch(HEX_ID_PATTERN);
    expect(secondIds[0]).toBe(firstIds[0]);
    expect(firstIds.join(",")).not.toContain(E2E_EMAIL);
    await expect(firstPage.getByText(E2E_NAME_PATTERN)).toBeVisible();

    await first.close();
    await second.close();
  });

  test("sends no identifier after sign-out until the user signs in again", async ({ page }) => {
    // Arrange
    await installUmamiStub(page);
    await signIn(page);
    expect((await identifyValues(page.context())).length).toBeGreaterThan(0);

    // Act: sign-out is a full navigation, which resets the in-memory identity
    await page.goto("/auth/logout");
    await page.goto("/sign-in");

    // Assert
    expect(await identifyValues(page.context())).toEqual([]);
  });
});
