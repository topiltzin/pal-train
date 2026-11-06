import { expect, test } from "@playwright/test";
import {
  ANALYTICS_SKIP_REASON,
  STUB_SCRIPT_URL,
  STUB_WEBSITE_ID,
  analyticsE2eEnabled,
  installUmamiStub,
  recordedCalls,
} from "./helpers/umami-stub";

test.describe("page view tracking, analytics on", () => {
  test.skip(!analyticsE2eEnabled, ANALYTICS_SKIP_REASON);

  test("renders the tracker with the website identifier and privacy attributes", async ({
    page,
  }) => {
    // Arrange
    await installUmamiStub(page);

    // Act
    await page.goto("/sign-in");

    // Assert
    const tracker = page.locator(`script[src="${STUB_SCRIPT_URL}"]`);
    await expect(tracker).toHaveAttribute("data-website-id", STUB_WEBSITE_ID);
    await expect(tracker).toHaveAttribute("data-do-not-track", "true");
    await expect(tracker).toHaveAttribute("data-exclude-search", "true");
    await expect(tracker).not.toHaveAttribute("data-distinct-id", /.*/);
  });

  test("records a page view on the public sign-in page", async ({ page }) => {
    // Arrange
    await installUmamiStub(page);

    // Act
    await page.goto("/sign-in");

    // Assert
    await expect
      .poll(
        async () => (await recordedCalls(page)).filter((call) => call.type === "pageview").length,
      )
      .toBeGreaterThan(0);
  });
});

test.describe("page view tracking, analytics off", () => {
  test.skip(analyticsE2eEnabled, "Runs only when analytics is configured off.");

  test("renders no tracker and makes no tracker request", async ({ page }) => {
    // Arrange
    let trackerRequested = false;
    await page.route(STUB_SCRIPT_URL, (route) => {
      trackerRequested = true;
      return route.fulfill({ body: "" });
    });

    // Act
    await page.goto("/sign-in");

    // Assert
    await expect(page.locator(`script[src="${STUB_SCRIPT_URL}"]`)).toHaveCount(0);
    expect(trackerRequested).toBe(false);
  });
});
