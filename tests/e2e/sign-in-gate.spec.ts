import { expect, test } from "@playwright/test";

test.describe("sign-in gate", () => {
  test("signed-out visitors are sent to the buddy sign-in screen with no workout content", async ({
    page,
  }) => {
    // Act
    await page.goto("/");

    // Assert
    await expect(page).toHaveURL(/\/sign-in$/);
    await expect(page.getByRole("heading", { name: "Hey, I'm your gym buddy" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Workout ideas" })).toHaveCount(0);
    await expect(page.getByRole("group", { name: "How are you feeling?" })).toHaveCount(0);
  });

  test("signed-out GET /api/me returns 401 UNAUTHENTICATED in the envelope", async ({
    request,
  }) => {
    // Act
    const response = await request.get("/api/me");
    const body = await response.json();

    // Assert
    expect(response.status()).toBe(401);
    expect(body).toMatchObject({
      success: false,
      data: null,
      error: { code: "UNAUTHENTICATED" },
    });
  });
});
