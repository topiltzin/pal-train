import type { EnabledAnalyticsConfig } from "@/features/analytics/analytics-env";

/**
 * Script attributes for the Umami tag. Pure: returns a new object and reads nothing from the
 * environment. The identity is deliberately absent; it is set after load (research §4).
 */
export function buildTrackerAttributes(
  config: EnabledAnalyticsConfig,
  appBaseUrl: string,
): Record<string, string> {
  return {
    "data-website-id": config.websiteId,
    "data-domains": new URL(appBaseUrl).hostname,
    "data-do-not-track": "true",
    "data-exclude-search": "true",
  };
}
