import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { buildAuthOptions, type AuthOptionsSettings } from "@/lib/auth/auth-options";
import { getEnv } from "@/lib/config/env";
import { getDb } from "@/lib/db/client";
import { authSchema } from "@/lib/db/auth-schema";
import { getMcpConfig } from "@/features/mcp/mcp-config";

function createAuth(settings: Omit<AuthOptionsSettings, "database">) {
  return betterAuth(
    buildAuthOptions({
      ...settings,
      database: drizzleAdapter(getDb(), { provider: "pg", schema: authSchema }),
    }),
  );
}

export type AuthInstance = ReturnType<typeof createAuth>;

let cachedAuth: AuthInstance | undefined;

/**
 * The Better Auth server instance. It is created on first use, so importing this module does
 * not open a database connection or read the environment.
 */
export function getAuth(): AuthInstance {
  if (!cachedAuth) {
    const env = getEnv();
    const mcp = getMcpConfig();
    cachedAuth = createAuth({
      baseURL: env.BETTER_AUTH_URL,
      secret: env.BETTER_AUTH_SECRET,
      resource: mcp.resource,
    });
  }
  return cachedAuth;
}
