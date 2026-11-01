import { afterEach, describe, expect, it, vi } from "vitest";
import { UnauthenticatedError } from "@/features/auth/session";
import { LibraryUnavailableError } from "@/features/library/library-repository";
import { routeErrorResponse } from "@/lib/api/route-error";

const ROUTE_LABEL = "GET /api/test";
const GENERIC_INTERNAL_MESSAGE = "Something went wrong. Please try again.";

describe("routeErrorResponse", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("maps UnauthenticatedError to 401 UNAUTHENTICATED", async () => {
    // Act
    const response = routeErrorResponse(new UnauthenticatedError(), ROUTE_LABEL);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(401);
    expect(body).toMatchObject({ success: false, error: { code: "UNAUTHENTICATED" } });
  });

  it("maps LibraryUnavailableError to 503 LIBRARY_UNAVAILABLE", async () => {
    // Act
    const response = routeErrorResponse(
      new LibraryUnavailableError(new Error("bad JSON")),
      ROUTE_LABEL,
    );
    const body = await response.json();

    // Assert
    expect(response.status).toBe(503);
    expect(body.error.code).toBe("LIBRARY_UNAVAILABLE");
  });

  it("maps any other error to a generic 500 INTERNAL and logs the detail", async () => {
    // Arrange
    const logSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const detail = new Error("database connection string in stack");

    // Act
    const response = routeErrorResponse(detail, ROUTE_LABEL);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(500);
    expect(body.error).toEqual({ code: "INTERNAL", message: GENERIC_INTERNAL_MESSAGE });
    expect(logSpy).toHaveBeenCalledWith(`${ROUTE_LABEL} failed`, detail);
  });
});
