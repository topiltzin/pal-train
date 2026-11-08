import { describe, expect, it } from "vitest";
import { checkConnection, type ConnectionLookup } from "@/features/mcp/connection-check";

type Row = { userId: string; clientId: string; status: "active" | "removed" };

function lookupFrom(rows: Row[]): ConnectionLookup {
  return {
    async findConnection(userId, clientId) {
      return rows.find((row) => row.userId === userId && row.clientId === clientId);
    },
  };
}

describe("checkConnection", () => {
  it("accepts a request whose connection is active", async () => {
    // Arrange
    const lookup = lookupFrom([{ userId: "user-1", clientId: "client-1", status: "active" }]);

    // Act
    const result = await checkConnection(lookup, { userId: "user-1", clientId: "client-1" });

    // Assert
    expect(result).toEqual({ ok: true });
  });

  it("refuses a request whose connection was removed", async () => {
    // Arrange
    const lookup = lookupFrom([{ userId: "user-1", clientId: "client-1", status: "removed" }]);

    // Act
    const result = await checkConnection(lookup, { userId: "user-1", clientId: "client-1" });

    // Assert
    expect(result).toEqual({ ok: false, reason: "removed" });
  });

  it("refuses a request with no connection row", async () => {
    // Arrange
    const lookup = lookupFrom([]);

    // Act
    const result = await checkConnection(lookup, { userId: "user-1", clientId: "client-1" });

    // Assert
    expect(result).toEqual({ ok: false, reason: "missing" });
  });

  it("refuses a request when the only connection belongs to another user", async () => {
    // Arrange
    const lookup = lookupFrom([{ userId: "user-2", clientId: "client-1", status: "active" }]);

    // Act
    const result = await checkConnection(lookup, { userId: "user-1", clientId: "client-1" });

    // Assert
    expect(result).toEqual({ ok: false, reason: "missing" });
  });
});
