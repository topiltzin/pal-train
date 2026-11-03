import { expect, test } from "@playwright/test";
import { hasE2eCredentials, SKIP_REASON, signIn } from "./helpers/sign-in";

test.describe("mood cards", () => {
  test.skip(!hasE2eCredentials, SKIP_REASON);

  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test("arrow keys move the selected mood round the dial", async ({ page }) => {
    // Arrange
    await page.getByRole("button", { name: "Energized" }).click();

    // Act
    await page.getByRole("button", { name: "Energized" }).press("ArrowRight");

    // Assert
    await expect(page.getByRole("button", { name: "Tired" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  test("clicking a mood card selects that mood", async ({ page }) => {
    // Arrange
    const stressed = page.getByRole("button", { name: "Stressed" });

    // Act
    await stressed.click();

    // Assert
    await expect(stressed).toHaveAttribute("aria-pressed", "true");
  });

  test("every mood card shows Pip in that mood", async ({ page }) => {
    // Arrange / Act
    const cards = page.getByRole("group", { name: "How are you feeling?" }).getByRole("button");

    // Assert
    await expect(cards).toHaveCount(8);
    await expect(page.getByRole("img", { name: "Pip, looking tired" })).toHaveCount(1);
  });
});
