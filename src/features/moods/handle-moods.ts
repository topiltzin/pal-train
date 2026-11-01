import { requireUser, UnauthenticatedError, type SessionGetter } from "@/features/auth/session";
import { moods } from "@/features/moods/moods";
import { ok } from "@/lib/api/envelope";
import { ErrorCodes } from "@/lib/api/error-codes";
import { errorResponse } from "@/lib/api/errors";

export async function handleListMoods(getSession?: SessionGetter): Promise<Response> {
  try {
    await requireUser(getSession);
    return Response.json(
      ok(
        moods.map((mood) => ({
          id: mood.id,
          label: mood.label,
          buddyLine: mood.buddyLine,
          accent: mood.accent,
          intensityRange: mood.intensityRange,
        })),
      ),
    );
  } catch (error) {
    if (error instanceof UnauthenticatedError) {
      return errorResponse(ErrorCodes.UNAUTHENTICATED, error.message);
    }
    console.error("GET /api/moods failed", error);
    return errorResponse(ErrorCodes.INTERNAL, "Something went wrong. Please try again.");
  }
}
