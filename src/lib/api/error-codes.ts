export const ErrorCodes = {
  UNAUTHENTICATED: "UNAUTHENTICATED",
  INVALID_INPUT: "INVALID_INPUT",
  NOT_FOUND: "NOT_FOUND",
  LIBRARY_UNAVAILABLE: "LIBRARY_UNAVAILABLE",
  INTERNAL: "INTERNAL",
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];
