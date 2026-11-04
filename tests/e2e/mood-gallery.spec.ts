import { expect, test } from "@playwright/test";
import { hasE2eCredentials, SKIP_REASON, signIn } from "./helpers/sign-in";

const GALLERY_NAME = "Image accordion gallery";
const MOOD_LABEL = 'p[aria-live="polite"]';

test.describe("mood gallery", () => {
  test.skip(!hasE2eCredentials, SKIP_REASON);

  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test("starts with no mood picked and shows all eight mood panels", async ({ page }) => {
    // Arrange / Act
    const panels = page.getByRole("list", { name: GALLERY_NAME }).getByRole("listitem");

    // Assert
    await expect(page.locator(MOOD_LABEL)).toHaveText("Pick a mood");
    await expect(panels).toHaveCount(8);
  });

  test("arrow keys move to the next panel and select its mood", async ({ page }) => {
    // Arrange
    const energized = page.getByRole("listitem", { name: "Energized" });
    await energized.focus();

    // Act
    await page.keyboard.press("ArrowRight");

    // Assert
    await expect(page.locator(MOOD_LABEL)).toHaveText("Tired");
    await expect(page.getByRole("listitem", { name: "Tired" })).toHaveAttribute(
      "aria-current",
      "true",
    );
  });
});
