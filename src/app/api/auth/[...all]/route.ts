import { toNextJsHandler } from "better-auth/next-js";
import { getAuth } from "@/lib/auth/better-auth";

/**
 * Better Auth's catch-all route: sign-up, sign-in, sign-out, session, the OAuth endpoints
 * (/oauth2/*), and the signing keys (/jwks). The handler is built per request, so importing
 * this route does not read the environment or open a database connection.
 */
export async function GET(request: Request): Promise<Response> {
  return toNextJsHandler(getAuth()).GET(request);
}

export async function POST(request: Request): Promise<Response> {
  return toNextJsHandler(getAuth()).POST(request);
}
