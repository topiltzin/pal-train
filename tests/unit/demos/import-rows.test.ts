import { describe, expect, it } from "vitest";
import { parseReviewedCsv } from "@/features/demos/import-rows";

const HEADER = "exercise_id,video_id,source_title,decision,note";

describe("parseReviewedCsv", () => {
  it("returns only the rows marked accept", () => {
    // Arrange
    const csv = [
      HEADER,
      "back-002,5Fcm13Fa8ok,Lat Pulldown Tips,accept,title names the movement",
      "back-004,Q09RuHUx56A,Single Arm Dumbbell Row Mistakes,reject,different movement",
    ].join("\n");

    // Act
    const { links, problems } = parseReviewedCsv(csv);

    // Assert
    expect(links).toEqual([
      { exerciseId: "back-002", videoId: "5Fcm13Fa8ok", sourceTitle: "Lat Pulldown Tips" },
    ]);
    expect(problems).toEqual([]);
  });

  it("reports an accepted row with an invalid video id instead of storing it", () => {
    // Arrange
    const csv = [HEADER, "back-002,not-valid,Lat Pulldown Tips,accept,"].join("\n");

    // Act
    const { links, problems } = parseReviewedCsv(csv);

    // Assert
    expect(links).toEqual([]);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain("back-002");
  });

  it("reports an accepted row with an empty title", () => {
    // Arrange
    const csv = [HEADER, "back-002,5Fcm13Fa8ok,,accept,"].join("\n");

    // Act
    const { links, problems } = parseReviewedCsv(csv);

    // Assert
    expect(links).toEqual([]);
    expect(problems).toHaveLength(1);
  });

  it("reports two accepted rows for the same exercise and stores neither", () => {
    // Arrange
    const csv = [
      HEADER,
      "chest-005,IFzYdoNYJkY,Bench Press Mistakes,accept,",
      "chest-005,8yRvm7a8q1Q,Another Bench Video,accept,",
    ].join("\n");

    // Act
    const { links, problems } = parseReviewedCsv(csv);

    // Assert
    expect(links).toEqual([]);
    expect(problems.join(" ")).toContain("chest-005");
  });

  it("reads a title that contains commas when it is quoted", () => {
    // Arrange
    const csv = [HEADER, 'chest-005,IFzYdoNYJkY,"Bench Press, Mistakes, and Fixes",accept,'].join(
      "\n",
    );

    // Act
    const { links } = parseReviewedCsv(csv);

    // Assert
    expect(links[0].sourceTitle).toBe("Bench Press, Mistakes, and Fixes");
  });

  it("reports a decision that is neither accept nor reject", () => {
    // Arrange
    const csv = [HEADER, "chest-005,IFzYdoNYJkY,Title,maybe,"].join("\n");

    // Act
    const { links, problems } = parseReviewedCsv(csv);

    // Assert
    expect(links).toEqual([]);
    expect(problems).toHaveLength(1);
  });

  it("rejects a file whose header is not the reviewed format", () => {
    // Act / Assert
    expect(() => parseReviewedCsv("exercise,video\nback-002,5Fcm13Fa8ok")).toThrow("header");
  });
});
