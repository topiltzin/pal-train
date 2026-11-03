import { expect, test } from "@playwright/test";
import { hasE2eCredentials, SKIP_REASON, signIn } from "./helpers/sign-in";

const DIAL_NAME = "How are you feeling?";
const DIAL_RADIUS_RATIO = 0.4;
const DRAG_STEPS = 20;
const QUARTER_TURN_RAD = Math.PI / 2;

test.describe("mood dial", () => {
  test.skip(!hasE2eCredentials, SKIP_REASON);

  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test("arrow keys move the selected mood round the dial", async ({ page }) => {
    // Arrange
    await page.getByRole("button", { name: "Energized" }).click();

    // Act
    await page.getByRole("button", { name: "Energized" }).press("ArrowRight");

    // Assert
    await expect(page.getByRole("button", { name: "Tired" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  test("dragging a finger a quarter turn selects the mood it lands on", async ({ page }) => {
    // Arrange
    const box = (await page.getByRole("group", { name: DIAL_NAME }).boundingBox())!;
    const centreX = box.x + box.width / 2;
    const centreY = box.y + box.height / 2;
    const radius = box.width * DIAL_RADIUS_RATIO;

    // Act
    await page.mouse.move(centreX, centreY - radius);
    await page.mouse.down();
    for (let step = 1; step <= DRAG_STEPS; step += 1) {
      const angle = (step / DRAG_STEPS) * QUARTER_TURN_RAD;
      await page.mouse.move(centreX + radius * Math.sin(angle), centreY - radius * Math.cos(angle));
    }
    await page.mouse.up();

    // Assert
    await expect(page.getByRole("button", { name: "Stressed" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});
