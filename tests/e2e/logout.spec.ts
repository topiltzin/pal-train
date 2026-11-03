import { expect, test } from "@playwright/test";
import { hasE2eCredentials, SKIP_REASON, signIn } from "./helpers/sign-in";

test.describe("log out", () => {
  test.skip(!hasE2eCredentials, SKIP_REASON);

  test("Log out ends the session and returns the visitor to the sign-in screen", async ({
    page,
  }) => {
    // Arrange
    await signIn(page);

    // Act: Log out lives on the account card, inside the header menu
    await page.getByRole("button", { name: "Menu" }).click();
    await page.getByRole("link", { name: "Log out" }).click();

    // Assert
    await expect(page).toHaveURL(/\/sign-in$/, { timeout: 20000 });
    await expect(page.getByRole("heading", { name: "Hey, I'm your gym buddy" })).toBeVisible();
  });
});
