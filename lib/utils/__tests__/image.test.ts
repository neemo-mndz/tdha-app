import { describe, it, expect } from 'vitest';
import { calculateCropDimensions } from '../image';

describe('calculateCropDimensions', () => {
  it('returns full image for a square image', () => {
    const result = calculateCropDimensions(500, 500);
    expect(result).toEqual({ sx: 0, sy: 0, sWidth: 500, sHeight: 500 });
  });

  it('crops horizontally for a landscape image', () => {
    const result = calculateCropDimensions(800, 400);
    expect(result).toEqual({ sx: 200, sy: 0, sWidth: 400, sHeight: 400 });
  });

  it('crops vertically for a portrait image', () => {
    const result = calculateCropDimensions(400, 800);
    expect(result).toEqual({ sx: 0, sy: 200, sWidth: 400, sHeight: 400 });
  });

  it('handles 1x1 pixel image', () => {
    const result = calculateCropDimensions(1, 1);
    expect(result).toEqual({ sx: 0, sy: 0, sWidth: 1, sHeight: 1 });
  });

  it('floors offset for odd difference (landscape)', () => {
    // width=101, height=100 → size=100, sx = floor((101-100)/2) = 0
    const result = calculateCropDimensions(101, 100);
    expect(result).toEqual({ sx: 0, sy: 0, sWidth: 100, sHeight: 100 });
  });

  it('floors offset for odd difference (portrait)', () => {
    // width=100, height=101 → size=100, sy = floor((101-100)/2) = 0
    const result = calculateCropDimensions(100, 101);
    expect(result).toEqual({ sx: 0, sy: 0, sWidth: 100, sHeight: 100 });
  });

  it('always produces a square crop (sWidth === sHeight)', () => {
    const result = calculateCropDimensions(1920, 1080);
    expect(result.sWidth).toBe(result.sHeight);
    expect(result.sWidth).toBe(1080);
  });
});
