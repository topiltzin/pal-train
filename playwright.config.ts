import { defineConfig, devices } from "@playwright/test";

const PHONE_WIDTH_PX = 320;
const PHONE_HEIGHT_PX = 640;
const DEV_SERVER_URL = "http://localhost:3000";

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL: DEV_SERVER_URL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "phone-320",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: PHONE_WIDTH_PX, height: PHONE_HEIGHT_PX },
      },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: DEV_SERVER_URL,
    reuseExistingServer: true,
  },
});
