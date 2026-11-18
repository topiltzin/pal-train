import { describe, expect, it, vi } from "vitest";
import { handleResetRequest, type ResetFlowDeps } from "@/features/auth/password-reset-flow";
import { RESET_LIMIT_PER_HOUR } from "@/features/auth/password-reset-limit";

const NOW = new Date("2026-11-18T12:00:00Z");
const DATA = {
  user: { id: "user-1", email: "reader@example.test" },
  url: "https://www.pal-buddy.eu/api/auth/reset-password/tok-new?callbackURL=/reset-password",
  token: "tok-new",
};

function fakeDeps(recentRequests: Date[]) {
  const deps: ResetFlowDeps = {
    now: () => NOW,
    countRecent: vi.fn(async () => recentRequests),
    record: vi.fn(async () => {}),
    deleteOthers: vi.fn(async () => {}),
    deleteOne: vi.fn(async () => {}),
    deliver: vi.fn(() => {}),
    log: vi.fn(() => {}),
  };
  return deps;
}

describe("handleResetRequest", () => {
  it("accepts a request under the limit: records it, removes older links, and sends the email", async () => {
    // Arrange
    const deps = fakeDeps([]);

    // Act
    await handleResetRequest(DATA, deps);

    // Assert
    expect(deps.record).toHaveBeenCalledWith("user-1", NOW);
    expect(deps.deleteOthers).toHaveBeenCalledWith("user-1", "tok-new");
    expect(deps.deliver).toHaveBeenCalledTimes(1);
    expect(deps.log).toHaveBeenCalledWith("password reset requested", {
      userId: "user-1",
      email: DATA.user.email,
    });
    expect(deps.deleteOne).not.toHaveBeenCalled();
  });

  it("refuses a request at the limit: sends nothing, records nothing, and keeps older links", async () => {
    // Arrange
    const recent = Array.from({ length: RESET_LIMIT_PER_HOUR }, () => NOW);
    const deps = fakeDeps(recent);

    // Act
    await handleResetRequest(DATA, deps);

    // Assert
    expect(deps.deliver).not.toHaveBeenCalled();
    expect(deps.record).not.toHaveBeenCalled();
    expect(deps.deleteOthers).not.toHaveBeenCalled();
    expect(deps.log).toHaveBeenCalledWith("password reset refused", {
      userId: "user-1",
      email: DATA.user.email,
    });
  });

  it("removes only the refused request's own token, so the older valid link still works", async () => {
    // Arrange
    const recent = Array.from({ length: RESET_LIMIT_PER_HOUR }, () => NOW);
    const deps = fakeDeps(recent);

    // Act
    await handleResetRequest(DATA, deps);

    // Assert
    expect(deps.deleteOne).toHaveBeenCalledWith("tok-new");
  });

  it("counts requests for the account being reset", async () => {
    // Arrange
    const deps = fakeDeps([]);

    // Act
    await handleResetRequest(DATA, deps);

    // Assert
    expect(deps.countRecent).toHaveBeenCalledWith("user-1", NOW);
  });
});
