import { describe, expect, it } from "vitest";
import { cardGridLayout } from "@/features/moods/card-grid";

const COUNT = 8;
const PHONE_WIDTH_PX = 288;
const WIDE_WIDTH_PX = 680;

describe("cardGridLayout", () => {
  it("gives every mood one slot", () => {
    // Arrange / Act
    const layout = cardGridLayout(PHONE_WIDTH_PX, COUNT);

    // Assert
    expect(layout.slots).toHaveLength(COUNT);
  });

  it("centres a full row on the middle line", () => {
    // Arrange
    const layout = cardGridLayout(PHONE_WIDTH_PX, COUNT);
    const [left, middle, right] = layout.slots;

    // Act / Assert
    expect(middle.x).toBe(0);
    expect(left.x).toBeCloseTo(-right.x);
    expect(left.y).toBe(middle.y);
  });

  it("centres a short last row under the rows above it", () => {
    // Arrange: three columns on a phone, so eight moods make rows of 3, 3 and 2
    const layout = cardGridLayout(PHONE_WIDTH_PX, COUNT);
    const [penultimate, last] = layout.slots.slice(6);

    // Act / Assert
    expect(penultimate.x).toBeCloseTo(-last.x);
    expect(penultimate.x).not.toBe(0);
    expect(penultimate.y).toBe(last.y);
  });

  it("keeps every card inside the container width", () => {
    // Arrange
    const layout = cardGridLayout(PHONE_WIDTH_PX, COUNT);
    const halfCard = layout.cardSize / 2;

    // Act
    const furthestEdge = Math.max(...layout.slots.map((slot) => Math.abs(slot.x) + halfCard));

    // Assert
    expect(furthestEdge).toBeLessThanOrEqual(PHONE_WIDTH_PX / 2);
  });

  it("uses three columns on a phone and four on a wide container", () => {
    // Act
    const phone = cardGridLayout(PHONE_WIDTH_PX, COUNT);
    const wide = cardGridLayout(WIDE_WIDTH_PX, COUNT);

    // Assert
    expect(phone.columns).toBe(3);
    expect(wide.columns).toBe(4);
  });

  it("caps the card size on wide containers", () => {
    // Act
    const layout = cardGridLayout(WIDE_WIDTH_PX, COUNT);

    // Assert
    expect(layout.cardSize).toBe(132);
  });

  it("grows the container height with the number of rows", () => {
    // Arrange
    const oneRow = cardGridLayout(PHONE_WIDTH_PX, 3);
    const threeRows = cardGridLayout(PHONE_WIDTH_PX, COUNT);

    // Act / Assert
    expect(threeRows.containerHeight).toBeGreaterThan(oneRow.containerHeight);
  });

  it("tilts each card a little so the grid looks hand-placed", () => {
    // Act
    const layout = cardGridLayout(PHONE_WIDTH_PX, COUNT);

    // Assert
    const tilts = layout.slots.map((slot) => slot.rotate);
    expect(tilts.some((tilt) => tilt !== 0)).toBe(true);
    expect(tilts.every((tilt) => Math.abs(tilt) <= 6)).toBe(true);
  });

  it("sizes Pip inside the card, below the card edge", () => {
    // Act
    const layout = cardGridLayout(PHONE_WIDTH_PX, COUNT);

    // Assert
    expect(layout.pipSize).toBeGreaterThan(0);
    expect(layout.pipSize).toBeLessThan(layout.cardSize);
  });
});
