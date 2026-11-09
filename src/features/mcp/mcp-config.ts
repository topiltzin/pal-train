import { getEnv } from "@/lib/config/env";

/** The read-only capabilities this connector may ever grant (spec FR-004). */
export const MCP_READ_ONLY_SCOPES = ["plans:read", "library:read"] as const;

const MCP_PATH = "/mcp";
/** Where Better Auth mounts its routes, and therefore its signing keys (see research.md). */
const AUTH_BASE_PATH = "/api/auth";
const JWKS_PATH = "/jwks";

export type McpConfig = {
  /** The resource identifier: the audience every access token must carry. */
  resource: string;
  /** The Better Auth issuer that signs tokens for this resource (the origin, no trailing slash). */
  issuer: string;
  /** Where the connector fetches the public keys that verify token signatures. */
  jwksUrl: string;
  scopesSupported: readonly string[];
};

type McpSource = {
  BETTER_AUTH_URL?: string;
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
  const origin = new URL(requireValue(source, "BETTER_AUTH_URL")).origin;
  const issuer = `${origin}${AUTH_BASE_PATH}`;
  return {
    resource: `${origin}${MCP_PATH}`,
    issuer,
    jwksUrl: `${issuer}${JWKS_PATH}`,
    scopesSupported: MCP_READ_ONLY_SCOPES,
  };
}

/** Reads the app's validated environment and derives the MCP settings. */
export function getMcpConfig(): McpConfig {
  const env = getEnv();
  return parseMcpConfig({ BETTER_AUTH_URL: env.BETTER_AUTH_URL });
}
