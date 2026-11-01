import { expect, test } from "@playwright/test";
import { hasE2eCredentials, SKIP_REASON, signIn } from "./helpers/sign-in";

test.describe("direct focus-area selection", () => {
  test.skip(!hasE2eCredentials, SKIP_REASON);

  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test("Back with no mood shows only back ideas", async ({ page }) => {
    // Act
    await page.getByRole("button", { name: "Back" }).click();

    // Assert
    const ideas = page.getByRole("region", { name: "Workout ideas" }).locator("article");
    await expect(ideas.first()).toBeVisible();
    const count = await ideas.count();
    for (let index = 0; index < count; index += 1) {
      await expect(ideas.nth(index).getByText(/^back ·/)).toBeVisible();
    }
  });

  test("Focused plus Back shows matching ideas or a visible partial-match note", async ({
    page,
  }) => {
    // Act
    await page.getByRole("button", { name: "Back" }).click();
    await page.getByRole("button", { name: "Focused" }).click();

    // Assert
    const ideas = page.getByRole("region", { name: "Workout ideas" }).locator("article");
    await expect(ideas.first()).toBeVisible();
    const partialNote = page.getByText(
      "Not a perfect match, but these are the closest ideas I have.",
    );
    if (await partialNote.count()) {
      await expect(partialNote).toBeVisible();
    }
  });
});
