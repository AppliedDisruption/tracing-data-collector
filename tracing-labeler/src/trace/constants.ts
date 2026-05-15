/**
 * Tracing Constants - Non-layout styling (colors, stroke/guide widths).
 *
 * Canvas size is driven by theme tokens. Validation logic and thresholds live on the backend.
 */
export const TRACING_CONSTANTS = {
  GUIDE: {
    COLOR: '#4ECDC4',
    WIDTH: 8,
  },
  STROKE: {
    COLOR: '#9C27B0',
    COLOR_INCORRECT: '#F44336',
    COLOR_COMPLETE: '#4CAF50',
    WIDTH: 12,
  },
  BACKGROUND: {
    COLOR: '#A8D1FF',
  },
} as const;
