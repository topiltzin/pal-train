import { getAuth } from "@/lib/auth/better-auth";

const SIGN_IN_PATH = "/sign-in";

/**
 * Ends the Better Auth session and sends the user to the sign-in page. Better Auth returns the
 * Set-Cookie headers that clear the session, and they are passed through unchanged.
 */
export async function GET(request: Request): Promise<Response> {
  const location = new URL(SIGN_IN_PATH, request.url);
  const redirect = new Response(null, { status: 303, headers: { Location: location.toString() } });
  try {
    const result = await getAuth().api.signOut({ headers: request.headers, returnHeaders: true });
    for (const cookie of result.headers.getSetCookie()) {
      redirect.headers.append("set-cookie", cookie);
    }
  } catch (error) {
    // A missing or already-expired session still ends at the sign-in page; the failure is logged.
    console.error("sign-out failed", error);
  }
  return redirect;
}
