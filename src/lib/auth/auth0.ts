import { Auth0Client } from "@auth0/nextjs-auth0/server";
import { getEnv } from "@/lib/config/env";

let cachedClient: Auth0Client | undefined;

export function getAuth0(): Auth0Client {
  if (!cachedClient) {
    const env = getEnv();
    cachedClient = new Auth0Client({
      domain: env.AUTH0_DOMAIN,
      clientId: env.AUTH0_CLIENT_ID,
      clientSecret: env.AUTH0_CLIENT_SECRET,
      secret: env.AUTH0_SECRET,
      appBaseUrl: env.APP_BASE_URL,
    });
  }
  return cachedClient;
}
