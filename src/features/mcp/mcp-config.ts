import { getEnv } from "@/lib/config/env";

/** The read-only capabilities this connector may ever grant (spec FR-004). */
export const MCP_READ_ONLY_SCOPES = ["plans:read", "library:read"] as const;

const MCP_PATH = "/mcp";
const AUTH0_ISSUER_SCHEME = "https://";

export type McpConfig = {
  /** The resource identifier: the audience every access token must carry. */
  resource: string;
  /** The Auth0 issuer that signs tokens for this resource. */
  issuer: string;
  scopesSupported: readonly string[];
};

type McpSource = {
  APP_BASE_URL?: string;
  AUTH0_DOMAIN?: string;
};

function requireValue(source: McpSource, name: keyof McpSource): string {
  const value = (source[name] ?? "").trim();
  if (value === "") {
    throw new Error(`Missing MCP configuration: ${name}`);
  }
  return value;
}

/** Pure: derives the MCP resource settings from already-validated values. */
export function parseMcpConfig(source: McpSource): McpConfig {
  const origin = new URL(requireValue(source, "APP_BASE_URL")).origin;
  const domain = requireValue(source, "AUTH0_DOMAIN");
  return {
    resource: `${origin}${MCP_PATH}`,
    issuer: `${AUTH0_ISSUER_SCHEME}${domain}/`,
    scopesSupported: MCP_READ_ONLY_SCOPES,
  };
}

/** Reads the app's validated environment and derives the MCP settings. */
export function getMcpConfig(): McpConfig {
  const env = getEnv();
  return parseMcpConfig({ APP_BASE_URL: env.APP_BASE_URL, AUTH0_DOMAIN: env.AUTH0_DOMAIN });
}
