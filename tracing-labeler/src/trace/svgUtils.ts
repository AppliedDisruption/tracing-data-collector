/**
 * SVG Utility Functions
 *
 * Pure utility functions for SVG operations (NOT React hooks)
 */

/**
 * Parse viewBox string to get width and height.
 *
 * Accepts integers and decimal values, with optional negatives:
 * @example parseViewBox("0 0 260 300") => { width: 260, height: 300 }
 * @example parseViewBox("0 0 260.5 299.75") => { width: 260.5, height: 299.75 }
 */
export function parseViewBox(viewBox: string): { width: number; height: number } {
  const match = viewBox.match(
    /(-?\d*\.?\d+)\s+(-?\d*\.?\d+)\s+(-?\d*\.?\d+)\s+(-?\d*\.?\d+)/
  );
  if (match) {
    return {
      width: Number(match[3]),
      height: Number(match[4]),
    };
  }
  return { width: 260, height: 300 };
}
