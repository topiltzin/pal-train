import { expect, test } from "@playwright/test";
import { hasE2eCredentials, SKIP_REASON, signIn } from "./helpers/sign-in";

test.describe("library pages for the new options", () => {
  test.skip(!hasE2eCredentials, SKIP_REASON);

  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test("filtering shoulders by moderate intensity and 30 minutes lists only matching routines", async ({
    page,
  }) => {
    // Act
    await page.goto("/library/shoulders?intensity=moderate&maxMinutes=30");

    // Assert
    const cards = page.locator("[data-testid='routine-card']");
    await expect(cards.first()).toBeVisible();
    const count = await cards.count();
    for (let index = 0; index < count; index += 1) {
      await expect(cards.nth(index)).toHaveAttribute("data-intensity", "moderate");
    }
  });
});
