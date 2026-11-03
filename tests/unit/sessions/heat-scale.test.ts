import { describe, expect, it } from "vitest";
import {
  litSegmentCount,
  SEGMENT_COUNT,
  segmentColor,
  segmentHeightPercent,
} from "@/features/sessions/heat-scale";

const GREEN_RGB = "rgb(52 184 122)";
const AMBER_RGB = "rgb(240 180 41)";
const RED_RGB = "rgb(229 72 77)";

describe("litSegmentCount", () => {
  it("lights no segments at 0 minutes", () => {
    expect(litSegmentCount(0)).toBe(0);
  });

  it("lights every segment at 90 minutes", () => {
    expect(litSegmentCount(90)).toBe(SEGMENT_COUNT);
  });

  it("lights half the segments at 45 minutes", () => {
    expect(litSegmentCount(45)).toBe(SEGMENT_COUNT / 2);
  });

  it("never lights more segments than exist", () => {
    expect(litSegmentCount(500)).toBe(SEGMENT_COUNT);
  });
});

describe("segmentHeightPercent", () => {
  it("starts small and grows toward full height", () => {
    expect(segmentHeightPercent(0)).toBe(30);
    expect(segmentHeightPercent(SEGMENT_COUNT - 1)).toBe(100);
  });

  it("never decreases from one segment to the next", () => {
    for (let index = 1; index < SEGMENT_COUNT; index += 1) {
      expect(segmentHeightPercent(index)).toBeGreaterThan(segmentHeightPercent(index - 1));
    }
  });
});

describe("segmentColor", () => {
  it("is green for the first segment", () => {
    expect(segmentColor(0)).toBe(GREEN_RGB);
  });

  it("passes through amber at the midpoint", () => {
    expect(segmentColor((SEGMENT_COUNT - 1) / 2)).toBe(AMBER_RGB);
  });

  it("is red for the last segment", () => {
    expect(segmentColor(SEGMENT_COUNT - 1)).toBe(RED_RGB);
  });
});
