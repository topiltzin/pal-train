import Script from "next/script";
import { getAnalyticsConfig } from "@/features/analytics/analytics-env";
import { buildTrackerAttributes } from "@/features/analytics/tracker-attributes";
import { getEnv } from "@/lib/config/env";

/**
 * The Umami tracker tag. Server component: renders nothing when analytics is off, so no
 * tracker request is made and no configuration reaches the browser beyond the public tag.
 */
export function UmamiScript() {
  const config = getAnalyticsConfig();
  if (!config.enabled) {
    return null;
  }
  const attributes = buildTrackerAttributes(config, getEnv().APP_BASE_URL);
  return <Script src={config.scriptUrl} strategy="afterInteractive" {...attributes} />;
}
