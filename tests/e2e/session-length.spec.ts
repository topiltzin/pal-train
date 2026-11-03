import { expect, test } from "@playwright/test";
import { hasE2eCredentials, SKIP_REASON, signIn } from "./helpers/sign-in";

const DEFAULT_RANGE_TEXT = "30 to 60 minutes";
const MAX_HANDLE_NAME = "Longest session";
const MIN_HANDLE_NAME = "Shortest session";

test.describe("session length range", () => {
  test.skip(!hasE2eCredentials, SKIP_REASON);

  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test("shows the default 30 to 60 minute range", async ({ page }) => {
    await expect(page.getByText(DEFAULT_RANGE_TEXT)).toBeVisible();
  });

  test("releasing the maximum handle at 45 plans a session of at most 45 minutes", async ({
    page,
  }) => {
    // Arrange
    await page.getByRole("button", { name: "Energized" }).click();
    const maxHandle = page.getByRole("slider", { name: MAX_HANDLE_NAME });
    await expect(maxHandle).toBeVisible();

    // Act
    await maxHandle.fill("45");
    await maxHandle.press("Tab");

    // Assert
    await expect(page.getByText("30 to 45 minutes")).toBeVisible();
    const totalText = await page.getByTestId("session-total").innerText();
    const total = Number.parseInt(totalText, 10);
    expect(total).toBeLessThanOrEqual(45);
  });

  test("moving the minimum above the maximum moves the maximum with it", async ({ page }) => {
    // Arrange
    const minHandle = page.getByRole("slider", { name: MIN_HANDLE_NAME });

    // Act
    await minHandle.fill("75");

    // Assert
    await expect(page.getByText("75 to 75 minutes")).toBeVisible();
  });
});

test.describe("session length counts", () => {
  test.skip(!hasE2eCredentials, SKIP_REASON);

  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test("a 10 to 10 minute range shows at least 3 exercises or the shortfall message", async ({
    page,
  }) => {
    // Arrange
    await page.getByRole("button", { name: "Energized" }).click();

    // Act
    await page.getByRole("slider", { name: MAX_HANDLE_NAME }).fill("10");
    await page.getByRole("slider", { name: MIN_HANDLE_NAME }).fill("10");
    await page.getByRole("slider", { name: MIN_HANDLE_NAME }).press("Tab");

    // Assert
    const rows = page.locator("[data-testid='session-total'] ~ ul > li");
    const shortfall = page.getByText(/exercises fit between 10 and 10 minutes/);
    await expect(rows.first().or(shortfall)).toBeVisible();
    if ((await rows.count()) > 0) {
      expect(await rows.count()).toBeGreaterThanOrEqual(3);
    }
  });

  test("a 10 to 90 minute range with a mood shows up to 10 exercises within 90 minutes", async ({
    page,
  }) => {
    // Arrange
    await page.getByRole("button", { name: "Energized" }).click();

    // Act
    await page.getByRole("slider", { name: MAX_HANDLE_NAME }).fill("90");
    await page.getByRole("slider", { name: MAX_HANDLE_NAME }).press("Tab");

    // Assert
    const rows = page.locator("[data-testid='session-total'] ~ ul > li");
    await expect(rows.first()).toBeVisible();
    expect(await rows.count()).toBeLessThanOrEqual(10);
    const total = Number.parseInt(await page.getByTestId("session-total").innerText(), 10);
    expect(total).toBeLessThanOrEqual(90);
  });
});

test.describe("session plan details", () => {
  test.skip(!hasE2eCredentials, SKIP_REASON);

  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test("each exercise shows its equipment and the minutes add up to the total", async ({
    page,
  }) => {
    // Arrange
    await page.getByRole("button", { name: "Energized" }).click();

    // Act
    await page.getByRole("slider", { name: MAX_HANDLE_NAME }).fill("60");
    await page.getByRole("slider", { name: MAX_HANDLE_NAME }).press("Tab");

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

  test("a high-intensity exercise shows its caution", async ({ page }) => {
    // Arrange
    await page.getByRole("button", { name: "Energized" }).click();

    // Act
    await page.getByRole("slider", { name: MAX_HANDLE_NAME }).fill("60");
    await page.getByRole("slider", { name: MAX_HANDLE_NAME }).press("Tab");

    // Assert
    const cautions = page.getByTestId("exercise-caution");
    const count = await cautions.count();
    for (let index = 0; index < count; index += 1) {
      await expect(cautions.nth(index)).not.toBeEmpty();
    }
  });
});
