import { UnauthenticatedError } from "@/features/auth/session";
import { LibraryUnavailableError } from "@/features/library/library-repository";
import { ErrorCodes } from "@/lib/api/error-codes";
import { errorResponse } from "@/lib/api/errors";

/** Maps errors shared by every library and suggestion route to their envelope response. */
export function routeErrorResponse(error: unknown, routeLabel: string): Response {
  if (error instanceof UnauthenticatedError) {
    return errorResponse(ErrorCodes.UNAUTHENTICATED, error.message);
  }
  if (error instanceof LibraryUnavailableError) {
    return errorResponse(ErrorCodes.LIBRARY_UNAVAILABLE, error.message);
  }
  console.error(`${routeLabel} failed`, error);
  return errorResponse(ErrorCodes.INTERNAL, "Something went wrong. Please try again.");
}
