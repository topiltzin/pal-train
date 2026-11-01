import { requireUser, UnauthenticatedError, type SessionGetter } from "@/features/auth/session";
import { upsertUser } from "@/features/auth/user-repository";
import { ok } from "@/lib/api/envelope";
import { ErrorCodes } from "@/lib/api/error-codes";
import { errorResponse } from "@/lib/api/errors";

export async function handleGetMe(getSession?: SessionGetter): Promise<Response> {
  try {
    const claims = await requireUser(getSession);
    const user = await upsertUser(claims);
    return Response.json(ok({ id: user.id, displayName: user.displayName, email: user.email }));
  } catch (error) {
    if (error instanceof UnauthenticatedError) {
      return errorResponse(ErrorCodes.UNAUTHENTICATED, error.message);
    }
    console.error("GET /api/me failed", error);
    return errorResponse(ErrorCodes.INTERNAL, "Something went wrong. Please try again.");
  }
}
