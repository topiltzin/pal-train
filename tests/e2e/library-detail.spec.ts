import { expect, test } from "@playwright/test";
import { hasE2eCredentials, SKIP_REASON, signIn } from "./helpers/sign-in";

test.describe("idea detail", () => {
  test.skip(!hasE2eCredentials, SKIP_REASON);

  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test("an idea title opens its detail with the not-medical-advice notice", async ({ page }) => {
    // Arrange
    await page.getByRole("button", { name: "Back" }).click();
    const firstIdea = page
      .getByRole("region", { name: "Workout ideas" })
      .locator("article")
      .first();
    const title = await firstIdea.locator("h3 a").textContent();

    // Act
    await firstIdea.locator("h3 a").click();

    // Assert
    await expect(page.getByRole("heading", { level: 1, name: title ?? "" })).toBeVisible();
    await expect(page.getByRole("note").filter({ hasText: "not medical advice" })).toBeVisible();
  });

  test("an unknown idea id returns the not-found page", async ({ page }) => {
    // Act
    const response = await page.goto("/library/back/no-such-idea-999");

    // Assert
    expect(response?.status()).toBe(404);
  });
});
