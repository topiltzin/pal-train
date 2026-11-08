import { describe, expect, it } from "vitest";
import { needsApproval } from "@/features/mcp/connection-check";

const REMOVED_AT = new Date("2026-11-07T12:00:00Z");
const BEFORE_REMOVAL = new Date("2026-11-07T11:00:00Z");
const AFTER_REMOVAL = new Date("2026-11-07T13:00:00Z");

describe("needsApproval", () => {
  it("approves when the user has no connection yet and consent has just happened", () => {
    // Arrange, Act, Assert
    expect(needsApproval(undefined, AFTER_REMOVAL)).toBe(true);
  });

  it("does not re-approve an active connection", () => {
    // Arrange, Act, Assert
    expect(needsApproval({ status: "active", removedAt: null }, AFTER_REMOVAL)).toBe(false);
  });

  it("approves a removed connection when the token was issued after the removal (reconnect)", () => {
    // Arrange, Act, Assert
    expect(needsApproval({ status: "removed", removedAt: REMOVED_AT }, AFTER_REMOVAL)).toBe(true);
  });

  it("refuses a removed connection when the token was issued before the removal", () => {
    // Arrange, Act, Assert
    expect(needsApproval({ status: "removed", removedAt: REMOVED_AT }, BEFORE_REMOVAL)).toBe(false);
  });
});
