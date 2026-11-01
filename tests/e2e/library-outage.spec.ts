import { expect, test } from "@playwright/test";
import { hasE2eCredentials, SKIP_REASON, signIn } from "./helpers/sign-in";

const LIBRARY_UNAVAILABLE_BODY = {
  success: false,
  data: null,
  error: {
    code: "LIBRARY_UNAVAILABLE",
    message: "The workout library could not be loaded.",
  },
  meta: null,
};

test.describe("library outage", () => {
  test.skip(!hasE2eCredentials, SKIP_REASON);

  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test("shows a friendly outage message and keeps mood and focus controls visible", async ({
    page,
  }) => {
    // Arrange: the suggestions endpoint reports that the library cannot load (FR-014)
    await page.route("**/api/suggestions", (route) =>
      route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify(LIBRARY_UNAVAILABLE_BODY),
      }),
    );

    // Act
    await page.getByRole("button", { name: "Energized" }).click();

    // Assert
    await expect(page.getByRole("alert")).toContainText("taking a short break");
    await expect(page.getByRole("group", { name: "How are you feeling?" })).toBeVisible();
    await expect(page.getByRole("group", { name: "Focus area" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Workout ideas" })).toHaveCount(0);
  });
});
