import { expect, test } from "@playwright/test";
import { hasE2eCredentials, SKIP_REASON, signIn } from "./helpers/sign-in";

const MAX_SUGGESTIONS = 3;

test.describe("mood-based suggestions", () => {
  test.skip(!hasE2eCredentials, SKIP_REASON);

  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test("shows no workout before a mood is picked", async ({ page }) => {
    // Assert
    await expect(page.getByRole("group", { name: "How are you feeling?" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Workout ideas" })).toHaveCount(0);
  });

  test("Energized shows one to three ideas with the not-medical-advice notice", async ({
    page,
  }) => {
    // Act
    await page.getByRole("button", { name: "Energized" }).click();

    // Assert
    const ideas = page.getByRole("region", { name: "Workout ideas" }).locator("article");
    await expect(ideas.first()).toBeVisible();
    const count = await ideas.count();
    expect(count).toBeGreaterThanOrEqual(1);
    expect(count).toBeLessThanOrEqual(MAX_SUGGESTIONS);
    await expect(page.getByRole("note").filter({ hasText: "not medical advice" })).toBeVisible();
  });

  test("Tired shows only low or moderate intensity ideas", async ({ page }) => {
    // Act
    await page.getByRole("button", { name: "Tired" }).click();

    // Assert
    const ideas = page.getByRole("region", { name: "Workout ideas" }).locator("article");
    await expect(ideas.first()).toBeVisible();
    const count = await ideas.count();
    for (let index = 0; index < count; index += 1) {
      await expect(ideas.nth(index).getByText(/ intensity$/)).toContainText(/low|moderate/);
    }
  });
});
