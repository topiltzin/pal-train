import { expect, test, type Locator, type Page } from "@playwright/test";
import { hasE2eCredentials, signIn, SKIP_REASON } from "./helpers/sign-in";

/** Names of the plan's exercise cards, in order. */
async function cardNames(page: Page): Promise<string[]> {
  return page.getByTestId("plan-card-name").allTextContents();
}

async function planAnySession(page: Page): Promise<void> {
  await page.goto("/");
  await page
    .getByRole("button", { name: /^Choose / })
    .first()
    .click();
  await expect(page.getByTestId("session-total")).toBeVisible();
}

function swapButtonFor(page: Page, index: number): Locator {
  return page
    .getByTestId("plan-card")
    .nth(index)
    .getByRole("button", { name: /^Swap / });
}

test.describe("swap an exercise in a plan, signed in", () => {
  test.skip(!hasE2eCredentials, SKIP_REASON);

  test("swapping a card replaces only that card and keeps the others", async ({ page }) => {
    // Arrange
    await signIn(page);
    await planAnySession(page);
    const before = await cardNames(page);
    test.skip(before.length < 2, "The generated plan needs at least two cards to compare.");

    // Act
    await swapButtonFor(page, 0).click();

    // Assert
    const after = await cardNames(page);
    expect(after.length).toBe(before.length);
    expect(after[0]).not.toBe(before[0]);
    expect(after.slice(1)).toEqual(before.slice(1));
  });

  test("repeated swaps on the same card never show the same exercise twice in a row", async ({
    page,
  }) => {
    // Arrange
    await signIn(page);
    await planAnySession(page);
    const seen: string[] = [(await cardNames(page))[0]];

    // Act
    for (let round = 0; round < 3; round += 1) {
      await swapButtonFor(page, 0).click();
      seen.push((await cardNames(page))[0]);
    }

    // Assert
    for (let step = 1; step < seen.length; step += 1) {
      expect(seen[step]).not.toBe(seen[step - 1]);
    }
  });

  test("swap controls are disabled while the workout timer runs, and say why", async ({ page }) => {
    // Arrange
    await signIn(page);
    await planAnySession(page);

    // Act
    await page.getByRole("button", { name: "Start timer" }).click();

    // Assert
    await expect(swapButtonFor(page, 0)).toBeDisabled();
    await expect(page.getByText("Stop the timer to swap an exercise.")).toBeVisible();
  });
});

function chooseTriggerFor(page: Page, index: number): Locator {
  return page
    .getByTestId("plan-card")
    .nth(index)
    .getByRole("button", { name: /^Choose another/ });
}

test.describe("choose a replacement from the options list, signed in", () => {
  test.skip(!hasE2eCredentials, SKIP_REASON);

  test("opening the options lists other exercises with their details", async ({ page }) => {
    // Arrange
    await signIn(page);
    await planAnySession(page);
    const [firstName] = await cardNames(page);

    // Act
    await chooseTriggerFor(page, 0).click();

    // Assert
    const options = page.getByRole("region", { name: "Other exercises" });
    await expect(options).toBeVisible();
    await expect(options.getByText(/min, .+ intensity/).first()).toBeVisible();
    await expect(page.getByRole("button", { name: `Choose ${firstName}` })).toHaveCount(0);
  });

  test("choosing an option replaces the card, closes the list, and returns focus to the card", async ({
    page,
  }) => {
    // Arrange
    await signIn(page);
    await planAnySession(page);
    await chooseTriggerFor(page, 0).click();
    const options = page.getByRole("region", { name: "Other exercises" });
    const chosen = options.getByRole("button", { name: /^Choose / }).first();
    const chosenName = (await chosen.getByText(/.+/).first().textContent()) ?? "";

    // Act
    await chosen.click();

    // Assert
    await expect(page.getByTestId("plan-card-name").nth(0)).toHaveText(chosenName);
    await expect(options).toHaveCount(0);
    await expect(chooseTriggerFor(page, 0)).toBeFocused();
  });

  test("closing the list without choosing leaves the card unchanged", async ({ page }) => {
    // Arrange
    await signIn(page);
    await planAnySession(page);
    const [before] = await cardNames(page);
    await chooseTriggerFor(page, 0).click();

    // Act
    await page
      .getByRole("region", { name: "Other exercises" })
      .getByRole("button", { name: "Close" })
      .click();

    // Assert
    await expect(page.getByRole("region", { name: "Other exercises" })).toHaveCount(0);
    expect((await cardNames(page))[0]).toBe(before);
  });
});

test.describe("keep the workout within its length range, signed in", () => {
  test.skip(!hasE2eCredentials, SKIP_REASON);

  test("an option that would leave the length range is disabled and says why", async ({ page }) => {
    // Arrange
    await signIn(page);
    await planAnySession(page);
    await chooseTriggerFor(page, 0).click();
    const options = page.getByRole("region", { name: "Other exercises" });
    const unavailable = options
      .getByRole("button", { name: /^Choose / })
      .filter({ hasText: "Would go outside your length range." });
    test.skip(
      (await unavailable.count()) === 0,
      "This generated plan has no option that would leave its range.",
    );

    // Act and Assert
    await expect(unavailable.first()).toBeDisabled();
    await expect(unavailable.first()).toContainText("Would go outside your length range.");
  });
});
