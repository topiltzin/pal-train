import { describe, expect, it } from "vitest";
import { appNavCards, LOG_OUT_HREF } from "@/features/navigation/app-nav-items";
import { focusAreas } from "@/features/library/focus-areas";

describe("appNavCards", () => {
  it("opens with the planner, the library, and the account card", () => {
    // Act
    const labels = appNavCards("Sam", focusAreas).map((card) => card.label);

    // Assert
    expect(labels).toEqual(["Plan a session", "Library", "Hi, Sam!"]);
  });

  it("links the planner card back to the home screen", () => {
    // Act
    const planner = appNavCards("Sam", focusAreas)[0];

    // Assert
    expect(planner.links).toEqual([{ label: "Open planner", href: "/" }]);
  });

  it("links each library shortcut to its muscle group page", () => {
    // Act
    const library = appNavCards("Sam", focusAreas)[1];

    // Assert
    expect(library.links.length).toBeGreaterThan(0);
    for (const link of library.links) {
      expect(link.href).toMatch(/^\/library\/[a-z-]+$/);
    }
  });

  it("skips a library shortcut when its muscle group is missing", () => {
    // Arrange: only the back muscle group is available
    const back = focusAreas.filter((area) => area.id === "back");

    // Act
    const library = appNavCards("Sam", back)[1];

    // Assert
    expect(library.links).toEqual([{ label: "Back", href: "/library/back" }]);
  });

  it("offers connected apps and a log out link on the account card", () => {
    // Act
    const account = appNavCards("Sam", focusAreas)[2];

    // Assert
    expect(account.links).toEqual([
      { label: "Connected apps", href: "/connections" },
      { label: "Log out", href: LOG_OUT_HREF },
    ]);
    expect(LOG_OUT_HREF).toBe("/auth/logout");
  });
});
