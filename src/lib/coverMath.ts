export interface CoverRect {
  renderedW: number;
  renderedH: number;
  offsetX: number;
  offsetY: number;
  scale: number;
}

export const HERO_IMAGE_WIDTH = 1376;
export const HERO_IMAGE_HEIGHT = 768;

/**
 * Computes exact rendered rectangle and offsets for an image using
 * `object-fit: cover` (`object-position: center center`) inside a container.
 */
export function computeCoverRect(
  containerW: number,
  containerH: number,
  imageW: number = HERO_IMAGE_WIDTH,
  imageH: number = HERO_IMAGE_HEIGHT
): CoverRect {
  if (containerW <= 0 || containerH <= 0 || imageW <= 0 || imageH <= 0) {
    return { renderedW: 0, renderedH: 0, offsetX: 0, offsetY: 0, scale: 1 };
  }
  const scale = Math.max(containerW / imageW, containerH / imageH);
  const renderedW = imageW * scale;
  const renderedH = imageH * scale;
  const offsetX = (containerW - renderedW) / 2;
  const offsetY = (containerH - renderedH) / 2;
  return { renderedW, renderedH, offsetX, offsetY, scale };
}

export interface ScreenBox {
  left: number;
  top: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

/**
 * Converts an image-percentage bounding box ({ x, y, w, h } in 0..100%)
 * to exact pixel coordinates inside a `object-fit: cover` container.
 */
export function percentBoxToScreen(
  box: { x: number; y: number; w: number; h: number },
  containerW: number,
  containerH: number,
  imageW: number = HERO_IMAGE_WIDTH,
  imageH: number = HERO_IMAGE_HEIGHT
): ScreenBox {
  const rect = computeCoverRect(containerW, containerH, imageW, imageH);
  const left = rect.offsetX + (box.x / 100) * rect.renderedW;
  const top = rect.offsetY + (box.y / 100) * rect.renderedH;
  const width = (box.w / 100) * rect.renderedW;
  const height = (box.h / 100) * rect.renderedH;
  return {
    left,
    top,
    width,
    height,
    centerX: left + width / 2,
    centerY: top + height / 2,
  };
}
