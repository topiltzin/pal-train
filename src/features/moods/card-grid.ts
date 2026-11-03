/**
 * Places the mood cards in a tidy grid that fills the width it is given.
 * Coordinates are pixels from the centre of the container, with +y pointing down.
 */

export type CardSlot = { x: number; y: number; rotate: number };

export type CardGridLayout = {
  containerWidth: number;
  containerHeight: number;
  cardSize: number;
  pipSize: number;
  columns: number;
  slots: CardSlot[];
};

const WIDE_MIN_WIDTH_PX = 520;
const COLUMNS_NARROW = 3;
const COLUMNS_WIDE = 4;
const GAP_PX = 12;
const MIN_CARD_PX = 40;
const MAX_CARD_PX = 132;
/** Pip is drawn at this share of the card, so the card's border and padding show around it. */
const PIP_SHARE = 0.6;
/** Room kept above and below the grid for the tilt and the hover lift. */
const VERTICAL_ALLOWANCE_SHARE = 0.12;
const TILT_DEG = [-5, 3, -2, 5, -3, 2, -4, 4];

export function cardGridLayout(width: number, count: number): CardGridLayout {
  const columns = width >= WIDE_MIN_WIDTH_PX ? COLUMNS_WIDE : COLUMNS_NARROW;
  const fittedSize = Math.floor((width - GAP_PX * (columns - 1)) / columns);
  const cardSize = Math.max(MIN_CARD_PX, Math.min(MAX_CARD_PX, fittedSize));
  const step = cardSize + GAP_PX;
  const rows = Math.ceil(count / columns);

  const slots = Array.from({ length: count }, (_, index): CardSlot => {
    const row = Math.floor(index / columns);
    const rowStart = row * columns;
    const rowLength = Math.min(columns, count - rowStart);
    const column = index - rowStart;
    return {
      x: (column - (rowLength - 1) / 2) * step,
      y: (row - (rows - 1) / 2) * step,
      rotate: TILT_DEG[index % TILT_DEG.length],
    };
  });

  return {
    containerWidth: width,
    containerHeight:
      rows * cardSize + (rows - 1) * GAP_PX + Math.ceil(cardSize * VERTICAL_ALLOWANCE_SHARE),
    cardSize,
    pipSize: Math.round(cardSize * PIP_SHARE),
    columns,
    slots,
  };
}
