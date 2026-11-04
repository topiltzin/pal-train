import { expect, test } from "@playwright/test";
import { hasE2eCredentials, SKIP_REASON, signIn } from "./helpers/sign-in";

const DEMO_BUTTON_NAME = /^Watch demo:/;

test.describe("exercise demo", () => {
  test.skip(!hasE2eCredentials, SKIP_REASON);

  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test("a plan row with a demo shows the Watch demo control", async ({ page }) => {
    // Arrange
    await page.getByRole("button", { name: "Energized" }).click();

    // Act / Assert
    await expect(page.getByRole("button", { name: DEMO_BUTTON_NAME }).first()).toBeVisible();
  });

  test("Watch demo opens on the same page and Escape closes it, returning focus", async ({
    page,
  }) => {
    // Arrange
    await page.getByRole("button", { name: "Energized" }).click();
    const watch = page.getByRole("button", { name: DEMO_BUTTON_NAME }).first();
    const addressBefore = page.url();

    // Act
    await watch.click();

    // Assert: the window is open and the address has not changed
    const demoWindow = page.getByRole("dialog");
    await expect(demoWindow).toBeVisible();
    expect(page.url()).toBe(addressBefore);

    // Act: close with Escape
    await page.keyboard.press("Escape");

    // Assert: closed, the page is unchanged, and focus is back on the control that opened it
    await expect(demoWindow).toHaveCount(0);
    expect(page.url()).toBe(addressBefore);
    await expect(watch).toBeFocused();
  });
});
