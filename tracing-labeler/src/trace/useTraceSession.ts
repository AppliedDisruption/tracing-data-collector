import { useState, useCallback, useMemo, useRef } from 'react';
import { Animated } from 'react-native';
import { useDrawing } from './useDrawing';
import { parseViewBox } from './svgUtils';
import { enqueueTraceAttempt, flushOutbox, newIdempotencyKey } from '../outbox/outbox';
import type { CharacterEntry } from './characters';

interface UseTraceSessionProps {
  labelerName: string;
  characters: CharacterEntry[];
  canvasWidth: number;
}

export type SaveStatus = 'idle' | 'saving' | 'error';

export function useTraceSession({ labelerName, characters, canvasWidth }: UseTraceSessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalSaved, setTotalSaved] = useState(0);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const currentCharacter = characters[currentIndex] ?? null;

  const canvasHeight = useMemo(() => {
    if (!currentCharacter) return canvasWidth;
    const { width: vbWidth, height: vbHeight } = parseViewBox(currentCharacter.viewBox);
    return canvasWidth * (vbHeight / vbWidth);
  }, [currentCharacter, canvasWidth]);

  const drawing = useDrawing({
    canvasWidth,
    canvasHeight,
    viewBox: currentCharacter?.viewBox ?? '0 0 260 300',
  });

  const guideOpacity = useRef(new Animated.Value(1)).current;

  const hasPoints =
    drawing.traceStrokes.length > 0 &&
    drawing.traceStrokes.some(stroke => stroke.points.length > 0);

  const isDone = currentIndex >= characters.length;

  const submitTrace = useCallback(
    async (label: 'correct' | 'wrong') => {
      if (!currentCharacter || !hasPoints || saveStatus === 'saving') return;

      setSaveStatus('saving');
      setErrorMessage(null);

      const idempotency_key = newIdempotencyKey();
      const payload = {
        idempotency_key,
        labeler: labelerName,
        character: currentCharacter.character,
        label,
        strokes: drawing.traceStrokes,
        canvas_w: Math.round(canvasWidth),
        canvas_h: Math.round(canvasHeight),
        svg_path: currentCharacter.svgPath,
        view_box: currentCharacter.viewBox,
      };

      try {
        await enqueueTraceAttempt(payload);
        setTotalSaved(prev => prev + 1);
        setCurrentIndex(prev => prev + 1);
        drawing.clearAttempt();
        setSaveStatus('idle');
      } catch (err) {
        setSaveStatus('error');
        setErrorMessage(err instanceof Error ? err.message : 'Could not save locally');
        return;
      }

      void flushOutbox().catch(() => {
        /* network errors: item stays in outbox; user can Sync from home */
      });
    },
    [
      currentCharacter,
      hasPoints,
      saveStatus,
      labelerName,
      drawing.traceStrokes,
      drawing.clearAttempt,
      canvasWidth,
      canvasHeight,
    ]
  );

  const clearAttempt = useCallback(() => {
    drawing.clearAttempt();
    setSaveStatus('idle');
    setErrorMessage(null);
  }, [drawing.clearAttempt]);

  return {
    currentCharacter,
    currentIndex,
    totalCharacters: characters.length,
    totalSaved,
    canvasWidth,
    canvasHeight,
    guideOpacity,
    paths: drawing.paths,
    currentPath: drawing.currentPath,
    onDrawingStart: drawing.onDrawingStart,
    onDrawingActive: drawing.onDrawingActive,
    onDrawingEnd: drawing.onDrawingEnd,
    validateTouchStart: drawing.validateTouchStart,
    hasPoints,
    saveStatus,
    errorMessage,
    isDone,
    submitTrace,
    clearAttempt,
  };
}
