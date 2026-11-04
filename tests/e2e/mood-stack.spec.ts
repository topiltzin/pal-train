import { expect, test } from "@playwright/test";
import { hasE2eCredentials, SKIP_REASON, signIn } from "./helpers/sign-in";

const MOOD_LABEL = 'p[aria-live="polite"]';

test.describe("mood stack", () => {
  test.skip(!hasE2eCredentials, SKIP_REASON);

  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test("starts with no mood picked and offers the top card's mood", async ({ page }) => {
    // Arrange / Act
    const stack = page.getByRole("group", { name: "Card stack" });

    // Assert
    await expect(page.locator(MOOD_LABEL)).toHaveText("Pick a mood");
    await expect(stack).toBeVisible();
    await expect(page.getByRole("button", { name: "Choose Energized" })).toBeVisible();
  });

  test("choosing the top card's mood selects it", async ({ page }) => {
    // Arrange
    const choose = page.getByRole("button", { name: "Choose Energized" });

    // Act
    await choose.click();

    // Assert
    await expect(page.locator(MOOD_LABEL)).toHaveText("Energized");
    await expect(page.getByRole("button", { name: "Energized chosen" })).toBeDisabled();
  });
});
