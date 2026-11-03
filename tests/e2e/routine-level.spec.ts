import { expect, test } from "@playwright/test";
import { hasE2eCredentials, SKIP_REASON, signIn } from "./helpers/sign-in";

test.describe("routine level", () => {
  test.skip(!hasE2eCredentials, SKIP_REASON);

  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test("a high-intensity routine shows High and its caution on the same page", async ({
    page,
  }) => {
    // Arrange: Arnold press is a high-intensity shoulder routine
    await page.goto("/library/shoulders");
    await page.getByRole("link", { name: "Arnold press" }).click();

    // Assert
    await expect(page.getByText("High", { exact: true })).toBeVisible();
    await expect(page.getByText(/Shoulder impingement risk/)).toBeVisible();
  });

  test("a low-intensity routine shows Low", async ({ page }) => {
    await page.goto("/library/shoulders");
    await page.getByRole("link", { name: "Band external rotation" }).click();
    await expect(page.getByText("Low", { exact: true })).toBeVisible();
  });
});
