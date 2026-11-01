import { fail } from "@/lib/api/envelope";
import { ErrorCodes, type ErrorCode } from "@/lib/api/error-codes";

export const errorStatus: Record<ErrorCode, number> = {
  [ErrorCodes.UNAUTHENTICATED]: 401,
  [ErrorCodes.INVALID_INPUT]: 400,
  [ErrorCodes.NOT_FOUND]: 404,
  [ErrorCodes.LIBRARY_UNAVAILABLE]: 503,
  [ErrorCodes.INTERNAL]: 500,
};

const GENERIC_INTERNAL_MESSAGE = "Something went wrong. Please try again.";

export function errorResponse(code: ErrorCode, message: string): Response {
  const safeMessage = code === ErrorCodes.INTERNAL ? GENERIC_INTERNAL_MESSAGE : message;
  return Response.json(fail(code, safeMessage), { status: errorStatus[code] });
}
