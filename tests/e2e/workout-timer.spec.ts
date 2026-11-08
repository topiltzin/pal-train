import { expect, test, type Page } from "@playwright/test";
import { hasE2eCredentials, signIn, SKIP_REASON } from "./helpers/sign-in";

const ONE_MINUTE_MS = 60_000;

/** Counts the tones the page's audio context creates, so the chime can be counted. */
async function countTones(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const created = { count: 0 };
    (window as unknown as { __tones: typeof created }).__tones = created;
    const Original = window.AudioContext;
    class CountingContext extends Original {
      createOscillator() {
        created.count += 1;
        return super.createOscillator();
      }
    }
    window.AudioContext = CountingContext;
  });
}

async function tonesPlayed(page: Page): Promise<number> {
  return page.evaluate(() => (window as unknown as { __tones: { count: number } }).__tones.count);
}

async function planAnySession(page: Page): Promise<number> {
  await page.goto("/");
  await page
    .getByRole("button", { name: /^Choose / })
    .first()
    .click();
  const total = page.getByTestId("session-total");
  await expect(total).toBeVisible();
  const minutes = Number((await total.textContent())?.match(/\d+/)?.[0]);
  return minutes;
}

test.describe("workout timer, signed in", () => {
  test.skip(!hasE2eCredentials, SKIP_REASON);

  test("counts down from the plan length and plays one chime at zero", async ({ page }) => {
    // Arrange
    await countTones(page);
    await page.clock.install();
    await signIn(page);
    const minutes = await planAnySession(page);
    await expect(page.getByRole("button", { name: "Start timer" })).toBeVisible();

    // Act
    await page.getByRole("button", { name: "Start timer" }).click();
    await page.clock.runFor(minutes * ONE_MINUTE_MS);

    // Assert
    await expect(page.getByText("Session complete")).toBeVisible();
    expect(await tonesPlayed(page)).toBe(2);
  });

  test("Finish shows the exact celebration text and plays no chime", async ({ page }) => {
    // Arrange
    await countTones(page);
    await page.clock.install();
    await signIn(page);
    await planAnySession(page);
    await page.getByRole("button", { name: "Start timer" }).click();

    // Act
    await page.getByRole("button", { name: "Finish" }).click();

    // Assert
    await expect(
      page.getByRole("status").filter({ hasText: "Well Done, we made it today!!" }),
    ).toBeVisible();
    expect(await tonesPlayed(page)).toBe(0);
  });

  test("Finish twice shows one celebration", async ({ page }) => {
    // Arrange
    await page.clock.install();
    await signIn(page);
    await planAnySession(page);
    await page.getByRole("button", { name: "Start timer" }).click();
    await page.getByRole("button", { name: "Finish" }).click();

    // Act
    await page.getByRole("button", { name: "Close" }).click();
    await page.getByRole("button", { name: "Start again" }).click();
    await page.getByRole("button", { name: "Start timer" }).click();
    await page.getByRole("button", { name: "Finish" }).click();

    // Assert
    await expect(
      page.getByRole("status").filter({ hasText: "Well Done, we made it today!!" }),
    ).toHaveCount(1);
  });

  test("with reduced motion on, the celebration shows its words and no shapes", async ({
    page,
  }) => {
    // Arrange
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.clock.install();
    await signIn(page);
    await planAnySession(page);
    await page.getByRole("button", { name: "Start timer" }).click();

    // Act
    await page.getByRole("button", { name: "Finish" }).click();

    // Assert
    await expect(page.getByText("Well Done, we made it today!!")).toBeVisible();
    await expect(page.locator(".timer-celebration__shape").first()).toBeHidden();
  });

  test("Stop holds the time, and Reset returns to the full length", async ({ page }) => {
    // Arrange
    await page.clock.install();
    await signIn(page);
    const minutes = await planAnySession(page);
    await page.getByRole("button", { name: "Start timer" }).click();
    await page.clock.runFor(5_000);

    // Act
    await page.getByRole("button", { name: "Stop" }).click();
    const held = await page.getByTestId("timer-remaining").textContent();
    await page.clock.runFor(30_000);

    // Assert
    await expect(page.getByTestId("timer-remaining")).toHaveText(held ?? "");
    await page.getByRole("button", { name: "Reset" }).click();
    await expect(page.getByTestId("timer-remaining")).toHaveText(`${minutes}:00`);
  });
});
