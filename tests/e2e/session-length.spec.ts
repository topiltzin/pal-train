import { expect, test } from "@playwright/test";
import { hasE2eCredentials, SKIP_REASON, signIn } from "./helpers/sign-in";

const DEFAULT_TEXT = "Up to 60 minutes";
const METER_NAME = "Session length";
const KEYBOARD_STEP_MINUTES = 5;

test.describe("session length meter", () => {
  test.skip(!hasE2eCredentials, SKIP_REASON);

  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test("shows the default up to 60 minutes", async ({ page }) => {
    await expect(page.getByText(DEFAULT_TEXT)).toBeVisible();
  });

  test("releasing the meter at 45 plans a session of at most 45 minutes", async ({ page }) => {
    // Arrange
    await page.getByRole("button", { name: "Energized" }).click();
    const meter = page.getByRole("slider", { name: METER_NAME });

    // Act
    await meter.fill("45");
    await meter.press("Tab");

    // Assert
    await expect(page.getByText("Up to 45 minutes")).toBeVisible();
    const total = Number.parseInt(await page.getByTestId("session-total").innerText(), 10);
    expect(total).toBeLessThanOrEqual(45);
  });

  test("arrow keys move the meter in 5 minute steps", async ({ page }) => {
    // Arrange
    await page.getByRole("button", { name: "Energized" }).click();
    const meter = page.getByRole("slider", { name: METER_NAME });

    // Act
    await meter.focus();
    await meter.press("ArrowRight");

    // Assert
    await expect(
      page.getByText(`Up to ${60 + KEYBOARD_STEP_MINUTES} minutes`),
    ).toBeVisible();
  });

  test("each exercise shows its equipment and the minutes add up to the total", async ({
    page,
  }) => {
    // Arrange
    await page.getByRole("button", { name: "Energized" }).click();

    // Act
    await page.getByRole("slider", { name: METER_NAME }).fill("60");
    await page.getByRole("slider", { name: METER_NAME }).press("Tab");

    // Assert
    const rows = page.locator("[data-testid='session-total'] ~ ul > li");
    await expect(rows.first()).toBeVisible();
    const rowCount = await rows.count();
    for (let index = 0; index < rowCount; index += 1) {
      await expect(rows.nth(index).getByTestId("exercise-equipment")).not.toBeEmpty();
    }
    const minuteTexts = await rows.getByTestId("exercise-minutes").allInnerTexts();
    const sum = minuteTexts.reduce((total, text) => total + Number.parseInt(text, 10), 0);
    const total = Number.parseInt(await page.getByTestId("session-total").innerText(), 10);
    expect(sum).toBe(total);
  });
});
