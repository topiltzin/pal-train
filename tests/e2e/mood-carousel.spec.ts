import { expect, test } from "@playwright/test";
import { hasE2eCredentials, SKIP_REASON, signIn } from "./helpers/sign-in";

const CAROUSEL_NAME = "Image carousel";
const MOOD_LABEL = 'p[aria-live="polite"]';

test.describe("mood carousel", () => {
  test.skip(!hasE2eCredentials, SKIP_REASON);

  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test("starts with no mood picked and every mood card drawn", async ({ page }) => {
    // Arrange / Act
    const carousel = page.getByRole("region", { name: CAROUSEL_NAME });

    // Assert
    await expect(page.locator(MOOD_LABEL)).toHaveText("Pick a mood");
    await expect(carousel).toContainText("Energized, 1 of 8");
  });

  test("arrow keys move the carousel and select the mood it lands on", async ({ page }) => {
    // Arrange
    const carousel = page.getByRole("region", { name: CAROUSEL_NAME });
    await carousel.focus();

    // Act
    await page.keyboard.press("ArrowRight");

    // Assert
    await expect(page.locator(MOOD_LABEL)).toHaveText("Tired");
    await expect(carousel).toContainText("Tired, 2 of 8");
  });
});
