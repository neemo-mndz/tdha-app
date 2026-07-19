/**
 * Calculates the crop dimensions for a centered square crop of an image.
 *
 * Given an image's width and height, returns the coordinates and size
 * of the largest centered square that fits within the image.
 * The Canvas API will use these with:
 * `drawImage(img, sx, sy, sWidth, sHeight, 0, 0, 256, 256)`
 *
 * @param width  - Original image width in pixels (must be ≥ 1)
 * @param height - Original image height in pixels (must be ≥ 1)
 * @returns Object with sx, sy (top-left of crop area) and sWidth, sHeight (crop dimensions)
 */
export function calculateCropDimensions(
  width: number,
  height: number
): { sx: number; sy: number; sWidth: number; sHeight: number } {
  const size = Math.min(width, height);
  const sx = Math.floor((width - size) / 2);
  const sy = Math.floor((height - size) / 2);
  return { sx, sy, sWidth: size, sHeight: size };
}
