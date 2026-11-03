import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ART_PIXELS, PalFace } from "@/components/pal/pal-face";
import {
  PAL_IMAGE_SRC,
  TINT_BY_EXPRESSION,
  TINT_OPACITY,
  WORDMARK_FADE_END,
  WORDMARK_FADE_START,
} from "@/components/pal/pip";
import type { PalExpression } from "@/features/pal/expressions";

/**
 * Draws a mood's Pip into a still image, the way components/pal/pip.tsx draws it on screen:
 * the artwork, the mood tint (the same colour blend, opacity, and wordmark fade), then the face.
 * The carousel is WebGL and takes image URLs, so each mood's card is rendered here once and cached.
 */

const ART_SIZE_PX = 512;
/** Matches --surface-raised in globals.css, the colour behind the carousel's cards. */
const ART_BACKGROUND = "#1f242d";
const WEBP_QUALITY = 0.92;
const percentOf = (value: string) => Number.parseFloat(value) / 100;

const artCache = new Map<PalExpression, Promise<string>>();

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Could not load ${src}`));
    image.src = src;
  });
}

/** The face is a standalone SVG, so it can be drawn as an image. Its size is set explicitly. */
function faceImageSrc(expression: PalExpression): string {
  const markup = renderToStaticMarkup(createElement(PalFace, { expression })).replace(
    "<svg ",
    `<svg xmlns="http://www.w3.org/2000/svg" width="${ART_PIXELS}" height="${ART_PIXELS}" `,
  );
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
}

/** A silhouette of the artwork in the mood colour, faded out above the wordmark. */
function tintLayer(base: HTMLImageElement, size: number, colour: string): HTMLCanvasElement {
  const layer = document.createElement("canvas");
  layer.width = size;
  layer.height = size;
  const ctx = layer.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available");
  ctx.drawImage(base, 0, 0, size, size);
  ctx.globalCompositeOperation = "source-atop";
  ctx.fillStyle = colour;
  ctx.fillRect(0, 0, size, size);
  ctx.globalCompositeOperation = "destination-in";
  const fade = ctx.createLinearGradient(
    0,
    size * percentOf(WORDMARK_FADE_START),
    0,
    size * percentOf(WORDMARK_FADE_END),
  );
  fade.addColorStop(0, "#000");
  fade.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = fade;
  ctx.fillRect(0, 0, size, size);
  return layer;
}

async function drawMoodArt(expression: PalExpression): Promise<string> {
  const [base, face] = await Promise.all([
    loadImage(PAL_IMAGE_SRC),
    loadImage(faceImageSrc(expression)),
  ]);
  const canvas = document.createElement("canvas");
  canvas.width = ART_SIZE_PX;
  canvas.height = ART_SIZE_PX;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available");
  // An opaque backing: the carousel would show transparent pixels as black.
  ctx.fillStyle = ART_BACKGROUND;
  ctx.fillRect(0, 0, ART_SIZE_PX, ART_SIZE_PX);
  ctx.drawImage(base, 0, 0, ART_SIZE_PX, ART_SIZE_PX);
  ctx.globalCompositeOperation = "color";
  ctx.globalAlpha = TINT_OPACITY;
  ctx.drawImage(tintLayer(base, ART_SIZE_PX, TINT_BY_EXPRESSION[expression]), 0, 0);
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;
  ctx.drawImage(face, 0, 0, ART_SIZE_PX, ART_SIZE_PX);
  return canvas.toDataURL("image/webp", WEBP_QUALITY);
}

/** Resolves to an image URL showing Pip in the given expression. Each expression renders once. */
export function moodCardArt(expression: PalExpression): Promise<string> {
  const cached = artCache.get(expression);
  if (cached) return cached;
  const rendered = drawMoodArt(expression);
  artCache.set(expression, rendered);
  return rendered;
}
