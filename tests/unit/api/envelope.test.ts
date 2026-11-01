import { describe, expect, it } from "vitest";
import { fail, ok } from "@/lib/api/envelope";
import { ErrorCodes } from "@/lib/api/error-codes";

describe("response envelope", () => {
  it("wraps a successful payload with success true, data, and null error", () => {
    // Arrange
    const payload = { id: "legs-004" };

    // Act
    const body = ok(payload);

    // Assert
    expect(body).toEqual({ success: true, data: payload, error: null, meta: null });
  });

  it("includes paging meta for list responses", () => {
    // Arrange
    const meta = { total: 13, limit: 20, offset: 0 };

    // Act
    const body = ok([], meta);

    // Assert
    expect(body.meta).toEqual(meta);
  });

  it("wraps a failure with success false, null data, and a coded error", () => {
    // Act
    const body = fail(ErrorCodes.UNAUTHENTICATED, "Please sign in to continue.");

    // Assert
    expect(body).toEqual({
      success: false,
      data: null,
      error: { code: "UNAUTHENTICATED", message: "Please sign in to continue." },
      meta: null,
    });
  });
});
