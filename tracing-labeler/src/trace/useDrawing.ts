/**
 * useDrawing Hook
 *
 * Handles touch input and creates SVG paths for drawing,
 * while also capturing raw timed strokes for backend validation.
 *
 * Vendored from EduApp `frontend/src/ui/metaTemplates/tracing/useDrawing.ts`
 * (imports only adjusted for this app).
 */

import { useState, useCallback, useRef } from 'react';
import { GestureResponderEvent } from 'react-native';
import { parseViewBox } from './svgUtils';
import { TracePoint, TraceStroke } from './tracingContracts';

export interface PathData {
  path: string;
  points: Array<{ x: number; y: number }>;
}

interface UseDrawingProps {
  canvasWidth: number;
  canvasHeight: number;
  viewBox: string;
}

export function useDrawing({ canvasWidth, canvasHeight, viewBox }: UseDrawingProps) {
  const [paths, setPaths] = useState<PathData[]>([]);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [currentPoints, setCurrentPoints] = useState<Array<{ x: number; y: number }>>([]);

  // Raw stroke data for the current attempt (canvas coordinate space)
  const [traceStrokes, setTraceStrokes] = useState<TraceStroke[]>([]);
  const [currentStrokePoints, setCurrentStrokePoints] = useState<TracePoint[]>([]);

  // Start time for the currently active stroke.
  // We make t relative per stroke (ms since stroke start) so the backend
  // gets comparable timing regardless of when the user started drawing.
  const strokeStartTimeRef = useRef<number | null>(null);

  // Track if stroke was ended due to leaving bounds - prevents new stroke from starting
  // until user releases and touches again
  const strokeEndedDueToBoundsRef = useRef<boolean>(false);

  // Track the last time a stroke ended due to bounds - prevents immediate new strokes
  const lastBoundsEndTimeRef = useRef<number>(0);
  const BOUNDS_END_COOLDOWN_MS = 100; // 100ms cooldown after ending stroke due to bounds

  // Track if we're currently in an active drawing session (responder is granted)
  // This helps us distinguish between a new stroke start vs continuation
  const isResponderActiveRef = useRef<boolean>(false);

  // Track the last point coordinates to detect sudden jumps (device glitches)
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const JUMP_THRESHOLD = 80; // Distance in pixels to filter out coordinate jumps

  // Parse viewBox to get scale factors (for SVG rendering paths)
  const { width: vbWidth, height: vbHeight } = parseViewBox(viewBox);
  const scaleX = vbWidth / canvasWidth;
  const scaleY = vbHeight / canvasHeight;

  /**
   * Validates and clamps coordinates to canvas bounds
   * @returns Validated coordinates with clamp flag, or null if invalid
   */
  const validateAndClampCoordinates = useCallback(
    (x: number, y: number): { x: number; y: number; wasClamped: boolean } | null => {
      if (
        typeof x !== 'number' ||
        typeof y !== 'number' ||
        !isFinite(x) ||
        !isFinite(y) ||
        isNaN(x) ||
        isNaN(y)
      ) {
        return null;
      }

      const wasClampedX = x < 0 || x > canvasWidth;
      const wasClampedY = y < 0 || y > canvasHeight;
      const wasClamped = wasClampedX || wasClampedY;

      const clampedX = Math.max(0, Math.min(x, canvasWidth));
      const clampedY = Math.max(0, Math.min(y, canvasHeight));

      return {
        x: clampedX,
        y: clampedY,
        wasClamped,
      };
    },
    [canvasWidth, canvasHeight]
  );

  const handleDrawingEnd = useCallback(() => {
    if (currentPath && currentPoints.length > 0) {
      setPaths(prev => [...prev, { path: currentPath, points: currentPoints }]);
      setCurrentPath('');
      setCurrentPoints([]);
    }

    if (currentStrokePoints.length > 0) {
      setTraceStrokes(prev => [...prev, { points: currentStrokePoints }]);
      setCurrentStrokePoints([]);
    }

    strokeStartTimeRef.current = null;

    isResponderActiveRef.current = false;

    lastPointRef.current = null;
  }, [currentPath, currentPoints, currentStrokePoints]);

  const handleDrawingStart = useCallback(
    (event: GestureResponderEvent) => {
      const { locationX, locationY } = event.nativeEvent;

      const currentTime = Date.now();
      if (
        strokeEndedDueToBoundsRef.current &&
        currentTime - lastBoundsEndTimeRef.current < BOUNDS_END_COOLDOWN_MS
      ) {
        return;
      }

      if (isResponderActiveRef.current && currentPath) {
        return;
      }

      const validated = validateAndClampCoordinates(locationX, locationY);
      if (!validated) {
        return;
      }

      if (locationX < 0 || locationX > canvasWidth || locationY < 0 || locationY > canvasHeight) {
        return;
      }

      isResponderActiveRef.current = true;

      strokeEndedDueToBoundsRef.current = false;
      lastBoundsEndTimeRef.current = 0;

      const { x, y } = validated;

      lastPointRef.current = { x, y };

      const scaledX = x * scaleX;
      const scaledY = y * scaleY;

      const path = `M${scaledX} ${scaledY}`;
      setCurrentPath(path);
      setCurrentPoints([{ x: scaledX, y: scaledY }]);

      const now = performance.now();
      strokeStartTimeRef.current = now;
      const t = 0;
      const tracePoint: TracePoint = {
        x,
        y,
        t,
      };
      setCurrentStrokePoints([tracePoint]);
    },
    [scaleX, scaleY, validateAndClampCoordinates]
  );

  const handleDrawingActive = useCallback(
    (event: GestureResponderEvent) => {
      if (!currentPath) {
        return;
      }

      if (strokeEndedDueToBoundsRef.current) {
        if (currentPath) {
          setCurrentPath('');
          setCurrentPoints([]);
        }
        return;
      }

      if (!isResponderActiveRef.current) {
        return;
      }

      const { locationX, locationY } = event.nativeEvent;

      if (
        typeof locationX !== 'number' ||
        typeof locationY !== 'number' ||
        !isFinite(locationX) ||
        !isFinite(locationY) ||
        isNaN(locationX) ||
        isNaN(locationY) ||
        locationX < 0 ||
        locationX > canvasWidth ||
        locationY < 0 ||
        locationY > canvasHeight
      ) {
        strokeEndedDueToBoundsRef.current = true;
        lastBoundsEndTimeRef.current = Date.now();
        isResponderActiveRef.current = false;
        handleDrawingEnd();
        return;
      }

      const validated = validateAndClampCoordinates(locationX, locationY);
      if (!validated) {
        strokeEndedDueToBoundsRef.current = true;
        lastBoundsEndTimeRef.current = Date.now();
        isResponderActiveRef.current = false;
        handleDrawingEnd();
        return;
      }

      const { x, y, wasClamped } = validated;

      if (lastPointRef.current) {
        const dx = x - lastPointRef.current.x;
        const dy = y - lastPointRef.current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > JUMP_THRESHOLD) {
          strokeEndedDueToBoundsRef.current = true;
          lastBoundsEndTimeRef.current = Date.now();
          isResponderActiveRef.current = false;
          handleDrawingEnd();
          return;
        }
      }

      lastPointRef.current = { x, y };

      if (wasClamped) {
        strokeEndedDueToBoundsRef.current = true;
        lastBoundsEndTimeRef.current = Date.now();
        isResponderActiveRef.current = false;
        handleDrawingEnd();
        return;
      }

      const scaledX = x * scaleX;
      const scaledY = y * scaleY;

      const newPath = `${currentPath} L${scaledX} ${scaledY}`;
      setCurrentPath(newPath);
      setCurrentPoints(prev => [...prev, { x: scaledX, y: scaledY }]);

      const now = performance.now();
      const strokeStart = strokeStartTimeRef.current ?? now;
      const t = now - strokeStart;
      const tracePoint: TracePoint = {
        x,
        y,
        t,
      };
      setCurrentStrokePoints(prev => [...prev, tracePoint]);
    },
    [currentPath, scaleX, scaleY, validateAndClampCoordinates, handleDrawingEnd]
  );

  const clearAttempt = useCallback(() => {
    setPaths([]);
    setCurrentPath('');
    setCurrentPoints([]);
    setTraceStrokes([]);
    setCurrentStrokePoints([]);
    strokeStartTimeRef.current = null;
    strokeEndedDueToBoundsRef.current = false;
    lastBoundsEndTimeRef.current = 0;
    isResponderActiveRef.current = false;
    lastPointRef.current = null;
  }, []);

  const validateTouchStart = useCallback(
    (x: number, y: number): boolean => {
      if (
        typeof x !== 'number' ||
        typeof y !== 'number' ||
        !isFinite(x) ||
        !isFinite(y) ||
        isNaN(x) ||
        isNaN(y)
      ) {
        return false;
      }

      const tolerance = 5;
      return (
        x >= -tolerance &&
        x <= canvasWidth + tolerance &&
        y >= -tolerance &&
        y <= canvasHeight + tolerance
      );
    },
    [canvasWidth, canvasHeight]
  );

  return {
    paths,
    currentPath,
    onDrawingStart: handleDrawingStart,
    onDrawingActive: handleDrawingActive,
    onDrawingEnd: handleDrawingEnd,
    traceStrokes,
    clearAttempt,
    validateTouchStart,
  };
}
