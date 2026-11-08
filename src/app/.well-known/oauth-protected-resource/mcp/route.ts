import { buildProtectedResourceMetadata } from "@/features/mcp/metadata";
import { getMcpConfig } from "@/features/mcp/mcp-config";

/** RFC 9728 metadata that MCP clients read to find Auth0 (spec FR-001, research §4). Public. */
export function GET(): Response {
  return Response.json(buildProtectedResourceMetadata(getMcpConfig()));
}
