/**
 * Optional Umami configuration. Analytics is all-or-nothing: unset means off, and a partial setup
 * fails at startup so a half-configured deploy cannot go unnoticed. Kept separate from the
 * app-wide env schema so the app still runs without analytics (spec FR-009, FR-010).
 */

const HASH_SECRET_MIN_LENGTH = 32;

export type EnabledAnalyticsConfig = {
  enabled: true;
  scriptUrl: string;
  websiteId: string;
  hashSecret: string;
};

export type AnalyticsConfig = { enabled: false } | EnabledAnalyticsConfig;

type AnalyticsValues = {
  UMAMI_SCRIPT_URL: string;
  UMAMI_WEBSITE_ID: string;
  ANALYTICS_HASH_SECRET: string;
};

const ANALYTICS_NAMES: readonly (keyof AnalyticsValues)[] = [
  "UMAMI_SCRIPT_URL",
  "UMAMI_WEBSITE_ID",
  "ANALYTICS_HASH_SECRET",
];

function readAnalyticsValues(source: Record<string, string | undefined>): AnalyticsValues {
  return {
    UMAMI_SCRIPT_URL: (source.UMAMI_SCRIPT_URL ?? "").trim(),
    UMAMI_WEBSITE_ID: (source.UMAMI_WEBSITE_ID ?? "").trim(),
    ANALYTICS_HASH_SECRET: (source.ANALYTICS_HASH_SECRET ?? "").trim(),
  };
}

function isAbsoluteHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function findProblems(values: AnalyticsValues): string[] {
  const missing = ANALYTICS_NAMES.filter((name) => values[name] === "");
  const invalid: string[] = [];
  if (values.UMAMI_SCRIPT_URL !== "" && !isAbsoluteHttpsUrl(values.UMAMI_SCRIPT_URL)) {
    invalid.push("UMAMI_SCRIPT_URL");
  }
  if (
    values.ANALYTICS_HASH_SECRET !== "" &&
    values.ANALYTICS_HASH_SECRET.length < HASH_SECRET_MIN_LENGTH
  ) {
    invalid.push("ANALYTICS_HASH_SECRET");
  }
  return [...new Set([...missing, ...invalid])];
}

export function parseAnalyticsEnv(source: Record<string, string | undefined>): AnalyticsConfig {
  const values = readAnalyticsValues(source);
  const anySet = ANALYTICS_NAMES.some((name) => values[name] !== "");
  if (!anySet) {
    return { enabled: false };
  }
  const problems = findProblems(values);
  if (problems.length > 0) {
    throw new Error(`Missing or invalid analytics environment variables: ${problems.join(", ")}`);
  }
  return {
    enabled: true,
    scriptUrl: values.UMAMI_SCRIPT_URL,
    websiteId: values.UMAMI_WEBSITE_ID,
    hashSecret: values.ANALYTICS_HASH_SECRET,
  };
}

let cachedConfig: AnalyticsConfig | undefined;

export function getAnalyticsConfig(): AnalyticsConfig {
  cachedConfig ??= parseAnalyticsEnv(process.env);
  return cachedConfig;
}
