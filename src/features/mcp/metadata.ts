import type { McpConfig } from "@/features/mcp/mcp-config";

export const BEARER_METHODS_SUPPORTED = ["header"] as const;

export type ProtectedResourceMetadata = {
  resource: string;
  authorization_servers: string[];
  scopes_supported: string[];
  bearer_methods_supported: string[];
};

/** Pure: the RFC 9728 protected resource metadata document for this connector. */
export function buildProtectedResourceMetadata(config: McpConfig): ProtectedResourceMetadata {
  return {
    resource: config.resource,
    authorization_servers: [config.issuer],
    scopes_supported: [...config.scopesSupported],
    bearer_methods_supported: [...BEARER_METHODS_SUPPORTED],
  };
}
