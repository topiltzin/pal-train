import { requireUser, UnauthenticatedError, type SessionGetter } from "@/features/auth/session";
import { focusAreas } from "@/features/library/focus-areas";
import { ok } from "@/lib/api/envelope";
import { ErrorCodes } from "@/lib/api/error-codes";
import { errorResponse } from "@/lib/api/errors";

export async function handleListFocusAreas(getSession?: SessionGetter): Promise<Response> {
  try {
    await requireUser(getSession);
    return Response.json(
      ok(
        focusAreas.map((area) => ({
          id: area.id,
          label: area.label,
          description: area.description,
        })),
      ),
    );
  } catch (error) {
    if (error instanceof UnauthenticatedError) {
      return errorResponse(ErrorCodes.UNAUTHENTICATED, error.message);
    }
    console.error("GET /api/focus-areas failed", error);
    return errorResponse(ErrorCodes.INTERNAL, "Something went wrong. Please try again.");
  }
}
