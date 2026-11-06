import { expect, test } from "@playwright/test";
import { hasE2eCredentials, signIn, SKIP_REASON } from "./helpers/sign-in";
import {
  ANALYTICS_SKIP_REASON,
  analyticsE2eEnabled,
  installUmamiStub,
  recordedCalls,
  type RecordedCall,
} from "./helpers/umami-stub";

function trackedEvents(calls: RecordedCall[]): RecordedCall[] {
  return calls.filter((call) => call.type === "track");
}

test.describe("named events, analytics on, signed in", () => {
  test.skip(!analyticsE2eEnabled, ANALYTICS_SKIP_REASON);
  test.skip(!hasE2eCredentials, SKIP_REASON);

  test("records mood selected with no data when a mood is chosen", async ({ page }) => {
    // Arrange
    await installUmamiStub(page);
    await signIn(page);

    // Act
    await page
      .getByRole("button", { name: /^Choose / })
      .first()
      .click();

    // Assert
    await expect
      .poll(async () => trackedEvents(await recordedCalls(page)))
      .toContainEqual(expect.objectContaining({ args: ["mood selected", {}] }));
  });

  test("records exercise demo watched with the exercise identifier", async ({ page }) => {
    // Arrange
    await installUmamiStub(page);
    await signIn(page);

    // Act
    await page
      .getByRole("button", { name: /^Watch demo: / })
      .first()
      .click();

    // Assert
    const events = trackedEvents(await recordedCalls(page));
    const demo = events.find((call) => call.args[0] === "exercise demo watched");
    expect(demo).toBeDefined();
    const data = demo?.args[1] as Record<string, unknown>;
    expect(Object.keys(data)).toEqual(["exerciseId"]);
    expect(typeof data.exerciseId).toBe("string");
  });
});
