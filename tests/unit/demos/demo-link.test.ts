import { describe, expect, it } from "vitest";
import {
  MAX_SOURCE_TITLE_LENGTH,
  toDemoView,
  validateNewDemoLink,
  type DemoLink,
} from "@/features/demos/demo-link";

const STORED_LINK: DemoLink = {
  id: 7,
  exerciseId: "chest-005",
  videoId: "IFzYdoNYJkY",
  sourceTitle: "Bench Press Mistakes You Should Avoid",
  channel: "officialdemic",
  active: true,
  addedAt: new Date("2026-11-04T10:00:00Z"),
};

describe("toDemoView", () => {
  it("returns only the video id and the title", () => {
    // Act
    const view = toDemoView(STORED_LINK);

    // Assert
    expect(view).toEqual({
      videoId: "IFzYdoNYJkY",
      title: "Bench Press Mistakes You Should Avoid",
    });
  });
});

describe("validateNewDemoLink", () => {
  const VALID_INPUT = {
    exerciseId: "chest-005",
    videoId: "IFzYdoNYJkY",
    sourceTitle: "Bench Press Mistakes You Should Avoid",
  };

  it("accepts a complete, well-formed link", () => {
    // Act / Assert
    expect(validateNewDemoLink(VALID_INPUT)).toEqual({ ok: true, value: VALID_INPUT });
  });

  it("rejects an invalid video id before anything is stored", () => {
    // Act
    const result = validateNewDemoLink({ ...VALID_INPUT, videoId: "bad id!" });

    // Assert
    expect(result).toEqual({ ok: false, reason: "video-id" });
  });

  it("rejects an empty source title", () => {
    // Act / Assert
    expect(validateNewDemoLink({ ...VALID_INPUT, sourceTitle: "" })).toEqual({
      ok: false,
      reason: "source-title",
    });
  });

  it("rejects a source title longer than the maximum", () => {
    // Arrange
    const tooLong = "x".repeat(MAX_SOURCE_TITLE_LENGTH + 1);

    // Act / Assert
    expect(validateNewDemoLink({ ...VALID_INPUT, sourceTitle: tooLong })).toEqual({
      ok: false,
      reason: "source-title",
    });
  });

  it("rejects a blank exercise id", () => {
    // Act / Assert
    expect(validateNewDemoLink({ ...VALID_INPUT, exerciseId: "  " })).toEqual({
      ok: false,
      reason: "exercise-id",
    });
  });
});
