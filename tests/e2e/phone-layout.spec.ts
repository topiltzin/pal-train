import { expect, test } from "@playwright/test";
import { hasE2eCredentials, SKIP_REASON, signIn } from "./helpers/sign-in";

const PHONE_WIDTH_PX = 320;

test.describe("phone layout", () => {
  test(`sign-in screen has no horizontal scroll at ${PHONE_WIDTH_PX}px`, async ({ page }) => {
    // Arrange
    await page.setViewportSize({ width: PHONE_WIDTH_PX, height: 640 });

    // Act
    await page.goto("/sign-in");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );

    // Assert
    expect(overflow).toBeLessThanOrEqual(0);
    await expect(page.getByRole("link", { name: "Sign in to get started" })).toBeVisible();
  });
});

test.describe("session length bar on a phone", () => {
  test.skip(!hasE2eCredentials, SKIP_REASON);

  test(`home screen has no horizontal scroll at ${PHONE_WIDTH_PX}px`, async ({ page }) => {
    // Arrange
    await page.setViewportSize({ width: PHONE_WIDTH_PX, height: 640 });
    await signIn(page);

    // Act
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );

    // Assert
    expect(overflow).toBeLessThanOrEqual(0);
    await expect(page.getByRole("slider", { name: "Session length" })).toBeVisible();
  });
});

test.describe("muscle group menu on a phone", () => {
  test.skip(!hasE2eCredentials, SKIP_REASON);

  test(`all 13 options fit at ${PHONE_WIDTH_PX}px without horizontal scroll`, async ({ page }) => {
    // Arrange
    await page.setViewportSize({ width: PHONE_WIDTH_PX, height: 640 });
    await signIn(page);

    // Act
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    const options = page.getByRole("group", { name: "Muscle group" }).getByRole("button");

    // Assert
    expect(overflow).toBeLessThanOrEqual(0);
    await expect(options).toHaveCount(13);
  });
});
