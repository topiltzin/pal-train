import { createRemoteJWKSet } from "jose";
import { writeAuditEntry } from "@/features/mcp/audit-log";
import { createDrizzleAuditSink } from "@/features/mcp/audit-repository";
import { checkConnection, needsApproval } from "@/features/mcp/connection-check";
import { createDrizzleConnectionRepository } from "@/features/mcp/connection-repository";
import { createMcpAuthGate } from "@/features/mcp/mcp-auth";
import { getMcpConfig } from "@/features/mcp/mcp-config";
import { createDrizzleRateCounter } from "@/features/mcp/rate-counter";
import { checkRateLimit } from "@/features/mcp/rate-limit";
import { createPaltrainHandler } from "@/features/mcp/server";
import { loadExerciseLibrary } from "@/features/sessions/exercise-library";

const RESOURCE_METADATA_PATH = "/.well-known/oauth-protected-resource/mcp";
const REQUIRED_SCOPE = "plans:read";
const JWKS_PATH = ".well-known/jwks.json";
/** The name shown for the connection in the user's connected apps list. */
const CONNECTOR_NAME = "ChatGPT";

type AuthGate = ReturnType<typeof createMcpAuthGate>;
type ProtocolHandler = ReturnType<typeof createPaltrainHandler>;

let cachedGate: AuthGate | undefined;
let cachedHandler: ProtocolHandler | undefined;

/** Built once per instance: the remote key set caches Auth0's signing keys between requests. */
function authGate(): AuthGate {
  if (cachedGate === undefined) {
    const config = getMcpConfig();
    cachedGate = createMcpAuthGate({
      settings: {
        issuer: config.issuer,
        resource: config.resource,
        jwks: createRemoteJWKSet(new URL(JWKS_PATH, config.issuer)),
        requiredScope: REQUIRED_SCOPE,
      },
      resourceMetadataUrl: new URL(RESOURCE_METADATA_PATH, config.resource).toString(),
    });
  }
  return cachedGate;
}

function protocolHandler(): ProtocolHandler {
  if (cachedHandler === undefined) {
    cachedHandler = createPaltrainHandler(loadExerciseLibrary().list());
  }
  return cachedHandler;
}

function json(body: unknown, status: number, headers?: Record<string, string>): Response {
  return Response.json(body, { status, headers });
}

/**
 * Every MCP request, in order: the bearer gate (FR-006), the connection check (FR-008), the
 * per-minute limit (FR-013), the audit entries (FR-015), then the tools.
 */
async function handle(request: Request): Promise<Response> {
  const auth = await authGate()(request);
  if (auth instanceof Response) {
    return auth;
  }
  const userId = String(auth.extra?.userId ?? "");
  const clientId = auth.clientId;
  const now = new Date();
  const audit = createDrizzleAuditSink();
  const connections = createDrizzleConnectionRepository();

  const issuedAt = auth.extra?.issuedAt instanceof Date ? auth.extra.issuedAt : new Date(0);
  const existing = await connections.findConnection(userId, clientId);
  if (needsApproval(existing, issuedAt)) {
    await connections.approve({
      userId,
      clientId,
      clientName: CONNECTOR_NAME,
      grantedScopes: auth.scopes.join(" "),
      now,
    });
    await writeAuditEntry(audit, { event: "consent_granted", userId, clientId }, now);
  }

  const connection = await checkConnection(connections, { userId, clientId });
  if (!connection.ok) {
    await writeAuditEntry(
      audit,
      { event: "connection_refused", userId, clientId, reasonCode: connection.reason },
      now,
    );
    return json({ error: "connection_inactive" }, 403);
  }

  const limit = await checkRateLimit(createDrizzleRateCounter(), userId, now);
  if (!limit.allowed) {
    await writeAuditEntry(
      audit,
      { event: "rate_limited", userId, clientId, reasonCode: "rate_limited" },
      now,
    );
    return json({ error: "rate_limited", message: "Too many requests. Try again shortly." }, 429, {
      "Retry-After": String(limit.retryAfterSeconds),
    });
  }

  await connections.touchLastUsed({ userId, clientId, now });
  await writeAuditEntry(audit, { event: "token_accepted", userId, clientId }, now);
  return protocolHandler().fetch(request, { authInfo: auth });
}

export const POST = handle;
export const GET = handle;
export const DELETE = handle;
