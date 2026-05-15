/**
 * Minimal tracing validation types (mirrors EduApp `frontend/src/core/contracts/tracing.ts`).
 * Used by `useDrawing` and trace attempt API payload typing.
 */
export type TracePoint = {
  x: number;
  y: number;
  /** Ms since stroke start; monotonic within stroke (from performance.now()). */
  t: number;
};

export type TraceStroke = {
  points: TracePoint[];
};
