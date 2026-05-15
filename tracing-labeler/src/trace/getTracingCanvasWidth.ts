/**
 * Same canvas width rule as EduApp `getTracingThemeTokens(windowWidth).canvasWidth`.
 * Keeps labeler stroke coordinates comparable to production tracing.
 */

type TracingSizeVariant = 'compact' | 'regular' | 'large';

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function getTracingCanvasWidth(windowWidth: number): number {
  const variant: TracingSizeVariant =
    windowWidth < 360 ? 'compact' : windowWidth >= 430 ? 'large' : 'regular';

  const horizontalPadding = variant === 'compact' ? 16 : variant === 'large' ? 24 : 20;
  const contentWidth = windowWidth - horizontalPadding * 2;
  const canvasWidthFraction = 0.92;
  return clamp(Math.floor(contentWidth * canvasWidthFraction), 260, 380);
}
