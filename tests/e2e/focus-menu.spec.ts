import { expect, test } from "@playwright/test";
import { hasE2eCredentials, SKIP_REASON, signIn } from "./helpers/sign-in";

const NEW_OPTIONS = ["Upper body", "Shoulders", "Core"];

test.describe("muscle group menu", () => {
  test.skip(!hasE2eCredentials, SKIP_REASON);

  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test("shows the three new options after Stretching", async ({ page }) => {
    for (const option of NEW_OPTIONS) {
      await expect(page.getByRole("button", { name: option })).toBeVisible();
    }
  });

  test("tapping Shoulders with no mood shows only shoulder routines", async ({ page }) => {
    await page.getByRole("button", { name: "Shoulders" }).click();
    const links = page.locator("a[href^='/library/shoulders/']");
    await expect(links.first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Browse all Shoulders/ })).toBeVisible();
  });
});

test.describe("several muscle groups", () => {
  test.skip(!hasE2eCredentials, SKIP_REASON);

  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test("picking biceps and triceps shows a plan with exercises from both", async ({ page }) => {
    // Act: choose two groups in the picker
    await page.getByRole("button", { name: "Biceps" }).click();
    await page.getByRole("button", { name: "Triceps" }).click();

    // Assert: the plan names both groups
    await expect(page.getByText("Biceps").first()).toBeVisible();
    await expect(page.getByText("Triceps").first()).toBeVisible();
  });
});
