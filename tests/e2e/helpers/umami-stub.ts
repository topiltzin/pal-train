import type { Page } from "@playwright/test";

/**
 * A stand-in for the self-hosted Umami tracker. The app's tag points here when the dev server runs
 * with UMAMI_SCRIPT_URL set to this URL, so tests never contact a real analytics service.
 * The stub records what Umami would send: page views (on load and on history changes) and the
 * track and identify calls made through window.umami.
 */
export const STUB_SCRIPT_URL = "https://analytics.e2e.invalid/script.js";
export const STUB_WEBSITE_ID = "00000000-0000-4000-8000-000000000001";

/** Analytics e2e tests need the dev server started with the UMAMI_* variables pointing at the stub. */
export const analyticsE2eEnabled = process.env.E2E_ANALYTICS === "1";

export const ANALYTICS_SKIP_REASON =
  "Start the dev server with UMAMI_SCRIPT_URL, UMAMI_WEBSITE_ID, and ANALYTICS_HASH_SECRET set to the stub values, then run with E2E_ANALYTICS=1 (see quickstart.md).";

export type RecordedCall = {
  type: "pageview" | "track" | "identify";
  args: unknown[];
};

const STUB_SOURCE = `
(() => {
  const calls = (window.__umamiCalls = []);
  const record = (type, args) => calls.push({ type, args: JSON.parse(JSON.stringify(args)) });
  const pageview = () => record("pageview", [location.pathname]);
  window.umami = {
    track: (...args) => record("track", args),
    identify: (...args) => record("identify", args),
  };
  for (const method of ["pushState", "replaceState"]) {
    const original = history[method];
    history[method] = function (...args) {
      const result = original.apply(this, args);
      pageview();
      return result;
    };
  }
  window.addEventListener("popstate", pageview);
  pageview();
})();
`;

export async function installUmamiStub(page: Page): Promise<void> {
  await page.route(STUB_SCRIPT_URL, (route) =>
    route.fulfill({ contentType: "application/javascript", body: STUB_SOURCE }),
  );
}

export async function recordedCalls(page: Page): Promise<RecordedCall[]> {
  return page.evaluate(
    () => (window as unknown as { __umamiCalls?: RecordedCall[] }).__umamiCalls ?? [],
  );
}
