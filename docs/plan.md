# Tracing Data Labeling App — Build Spec

## Purpose

Internal Expo (React Native + TypeScript) app for collecting labeled tracing stroke data. A labeler draws a letter on a canvas, taps Correct or Wrong, and the attempt saves to Supabase. That's the whole app.

Stroke data must be **identical** to the production app's `TraceStroke[]` so it's directly usable for ML training.

---

## File Structure

```
tracing-labeler/
├── app/
│   ├── index.tsx          # HomeScreen — name input + start
│   └── labeling.tsx       # LabelingScreen — the whole app
├── src/
│   ├── TracingCanvas.tsx  # COPIED from production, zero changes
│   ├── useDrawing.ts      # COPIED from production, zero changes
│   ├── constants.ts       # COPIED from production, zero changes
│   ├── svgUtils.ts        # COPIED from production, zero changes
│   ├── useLabeling.ts     # NEW — simple replacement for useTracingGame
│   ├── characters.ts      # NEW — list of characters with svgPath + viewBox
│   └── supabase.ts        # NEW — client init + saveAttempt function
├── .env
└── app.json
```

8 files total. 4 copied, 4 new.

---

## Project Setup

```bash
npx create-expo-app tracing-labeler --template blank-typescript
cd tracing-labeler
npx expo install react-native-svg
npx expo install @supabase/supabase-js
npx expo install @react-native-async-storage/async-storage
npx expo install react-native-url-polyfill
```

---

## Supabase Setup

### 1. Create project
- Go to supabase.com → New Project
- Name: `tracing-labels`
- Region: **South Asia (Mumbai)**

### 2. Create table — run in SQL Editor

```sql
create table attempts (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz default now(),
  labeler     text not null,
  character   text not null,
  label       text not null check (label in ('correct', 'wrong')),
  strokes     jsonb not null,
  canvas_w    integer not null,
  canvas_h    integer not null,
  svg_path    text not null,
  view_box    text not null
);

alter table attempts disable row level security;
```

### 3. Environment variables

Create `.env` in project root:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Both values come from Supabase dashboard → Project Settings → API.

---

## Files to Copy from Production (zero changes)

### `src/TracingCanvas.tsx`
Copy verbatim from `frontend/src/ui/metaTemplates/tracing/TracingCanvas.tsx`.

Renders the SVG guide underlay (`react-native-svg`) and the drawing overlay with touch responder handlers. Accepts these props — all passed from `useLabeling`:
- `svgPath`, `viewBox`, `canvasWidth`, `canvasHeight`
- `paths`, `currentPath` — for rendering drawn strokes
- `onDrawingStart`, `onDrawingActive`, `onDrawingEnd`, `validateTouchStart` — touch handlers
- `drawingEnabled` — freeze drawing during save
- `isCompleted`, `showGuide`, `guideOpacity`, `showIncorrect`, `strokeColor`, `shakeAnimation`

In the labeling app, always pass: `isCompleted={false}`, `showGuide={true}`, `showIncorrect={false}`, `strokeColor="default"`. No `shakeAnimation` needed.

### `src/useDrawing.ts`
Copy verbatim from `frontend/src/ui/metaTemplates/tracing/useDrawing.ts`.

This is the most important file. It captures all touch input and produces:
- `paths` + `currentPath` — SVG path strings in viewBox space, for rendering only
- `traceStrokes: TraceStroke[]` — raw stroke data in **canvas pixel space**, this is what gets saved
- `clearAttempt()` — resets everything between attempts

The `TraceStroke[]` shape: each stroke is `{ points: TracePoint[] }`, each point is `{ x, y, t }` where `t` is milliseconds since that stroke started (first point of every stroke is always `t=0`).

### `src/constants.ts`
Copy verbatim from `frontend/src/ui/metaTemplates/tracing/constants.ts`.

`TracingCanvas` imports `TRACING_CONSTANTS` from this file directly. Must live at `src/constants.ts`.

### `src/svgUtils.ts`
Copy verbatim from `frontend/src/ui/metaTemplates/tracing/utils/svgUtils.ts`.

Exports `parseViewBox(viewBox: string): { width: number; height: number }`. Used by `useLabeling` to derive canvas height from the viewBox aspect ratio.

---

## `src/characters.ts`

Holds every character you want to label. `svgPath` and `viewBox` come directly from your backend's `TracingInstance` data — same fields, same values.

```typescript
export type CharacterEntry = {
  character: string;   // e.g. "A"
  svgPath: string;     // SVG path data for the guide
  viewBox: string;     // e.g. "0 0 260 300"
};

export const CHARACTERS: CharacterEntry[] = [
  {
    character: 'B',
    svgPath: 'M43 25 L43 275 L155 275 Q218 275 218 213 Q218 150 155 150 L43 150 M43 150 L143 150 Q205 150 205 88 Q205 25 143 25 L43 25',
    viewBox: '0 0 260 300',
  },
  // Add all characters here. svgPath and viewBox come from your backend TracingInstance data.
];

// Returns a shuffled copy so each labeler gets a different order.
export function getShuffledCharacters(): CharacterEntry[] {
  const copy = [...CHARACTERS];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
```

---

## `src/supabase.ts`

Supabase client and the single save function. If you later switch to your production backend, only the `saveAttempt` function body changes here — nothing else in the app touches this file.

```typescript
import 'react-native-url-polyfill/auto';  // must be first import
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { TraceStroke } from './useDrawing';

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  }
);

export type LabeledAttempt = {
  labeler: string;
  character: string;
  label: 'correct' | 'wrong';
  strokes: TraceStroke[];   // direct from useDrawing — no transformation
  canvas_w: number;
  canvas_h: number;
  svg_path: string;
  view_box: string;
};

export async function saveAttempt(attempt: LabeledAttempt): Promise<void> {
  const { error } = await supabase.from('attempts').insert(attempt);
  if (error) throw new Error(error.message);
}
```

`TraceStroke` is imported directly from `useDrawing.ts` — no separate types file needed.

---

## `src/useLabeling.ts`

Replaces `useTracingGame`. No API validation, no animations, no attempt policy, no feedback engine. Coordinates the character queue, drawing state, and saving.

```typescript
import { useState, useCallback, useMemo, useRef } from 'react';
import { Animated } from 'react-native';
import { useDrawing } from './useDrawing';
import { parseViewBox } from './svgUtils';
import { saveAttempt, LabeledAttempt } from './supabase';
import { CharacterEntry } from './characters';

interface UseLabelingProps {
  labelerName: string;
  characters: CharacterEntry[];  // pre-shuffled, passed in once on mount
  canvasWidth: number;
}

export type SaveStatus = 'idle' | 'saving' | 'error';

export function useLabeling({ labelerName, characters, canvasWidth }: UseLabelingProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalSaved, setTotalSaved] = useState(0);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const currentCharacter = characters[currentIndex] ?? null;

  // Derive canvas height from viewBox aspect ratio — same logic as production useTracingGame
  const canvasHeight = useMemo(() => {
    if (!currentCharacter) return canvasWidth;
    const { width: vbWidth, height: vbHeight } = parseViewBox(currentCharacter.viewBox);
    return canvasWidth * (vbHeight / vbWidth);
  }, [currentCharacter, canvasWidth]);

  // useDrawing copied verbatim from production — same hook, same behavior, same output
  const drawing = useDrawing({
    canvasWidth,
    canvasHeight,
    viewBox: currentCharacter?.viewBox ?? '0 0 260 300',
  });

  // guideOpacity is always 1 — guide is always fully visible in labeling app
  const guideOpacity = useRef(new Animated.Value(1)).current;

  const hasPoints =
    drawing.traceStrokes.length > 0 &&
    drawing.traceStrokes.some(stroke => stroke.points.length > 0);

  const isDone = currentIndex >= characters.length;

  const submitLabel = useCallback(async (label: 'correct' | 'wrong') => {
    if (!currentCharacter || !hasPoints || saveStatus === 'saving') return;

    setSaveStatus('saving');
    setErrorMessage(null);

    try {
      await saveAttempt({
        labeler: labelerName,
        character: currentCharacter.character,
        label,
        strokes: drawing.traceStrokes,  // TraceStroke[] passed directly — no transformation
        canvas_w: canvasWidth,
        canvas_h: canvasHeight,
        svg_path: currentCharacter.svgPath,
        view_box: currentCharacter.viewBox,
      });

      setTotalSaved(prev => prev + 1);
      setCurrentIndex(prev => prev + 1);
      drawing.clearAttempt();
      setSaveStatus('idle');
    } catch (err) {
      setSaveStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Save failed');
    }
  }, [currentCharacter, hasPoints, saveStatus, labelerName, drawing.traceStrokes, drawing.clearAttempt, canvasWidth, canvasHeight]);

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
    // drawing state — passed directly to TracingCanvas
    paths: drawing.paths,
    currentPath: drawing.currentPath,
    onDrawingStart: drawing.onDrawingStart,
    onDrawingActive: drawing.onDrawingActive,
    onDrawingEnd: drawing.onDrawingEnd,
    validateTouchStart: drawing.validateTouchStart,
    // ui state
    hasPoints,
    saveStatus,
    errorMessage,
    isDone,
    // actions
    submitLabel,
    clearAttempt,
  };
}
```

---

## `app/index.tsx` — HomeScreen

Name input and Start button. On Start, navigate to `/labeling` passing `labelerName` as a route param.

```typescript
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const [name, setName] = useState('');
  const router = useRouter();
  const canStart = name.trim().length > 0;

  const handleStart = () => {
    if (!canStart) return;
    router.push({ pathname: '/labeling', params: { labelerName: name.trim() } });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Text style={styles.title}>Tracing Labeler</Text>
      <Text style={styles.subtitle}>Internal data collection tool</Text>

      <TextInput
        style={styles.input}
        placeholder="Your name"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
        returnKeyType="done"
        onSubmitEditing={handleStart}
      />

      <TouchableOpacity
        style={[styles.startButton, !canStart && styles.startButtonDisabled]}
        onPress={handleStart}
        disabled={!canStart}
      >
        <Text style={styles.startButtonText}>Start Labeling</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 40,
    backgroundColor: '#F5F5F5',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1565C0',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#888',
    textAlign: 'center',
    marginBottom: 48,
  },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    marginBottom: 20,
  },
  startButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  startButtonDisabled: { opacity: 0.4 },
  startButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
});
```

---

## `app/labeling.tsx` — LabelingScreen

The main loop. Renders the canvas, character prompt, and the three buttons.

**Layout top to bottom:**
1. `"Trace: {character}"` — large bold header
2. `"{n} / {total}"` — progress counter
3. `TracingCanvas` — centered, guide always visible
4. Status text area — "Saving…" / error message / "Draw the letter above" hint
5. Three buttons in a row: Clear | ✗ Wrong | ✓ Correct

**When `isDone` is true:** replace the entire screen with a completion message and a "Start New Session" button that navigates back to `/`.

```typescript
import { useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  useWindowDimensions, Platform
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { TracingCanvas } from '../src/TracingCanvas';
import { useLabeling } from '../src/useLabeling';
import { getShuffledCharacters } from '../src/characters';

export default function LabelingScreen() {
  const { labelerName } = useLocalSearchParams<{ labelerName: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();

  // Shuffled once on mount — never changes during the session
  const characters = useMemo(() => getShuffledCharacters(), []);

  // Canvas width matches production theme logic exactly
  const canvasWidth = Math.min(380, Math.max(260, Math.floor((width - 40) * 0.92)));

  const labeling = useLabeling({
    labelerName: labelerName ?? 'unknown',
    characters,
    canvasWidth,
  });

  // Session complete screen
  if (labeling.isDone) {
    return (
      <View style={styles.doneContainer}>
        <Text style={styles.doneTitle}>Session Complete!</Text>
        <Text style={styles.doneSubtitle}>You labeled {labeling.totalSaved} attempts</Text>
        <Text style={styles.doneInfo}>Data saved to Supabase</Text>
        <TouchableOpacity style={styles.newSessionButton} onPress={() => router.replace('/')}>
          <Text style={styles.newSessionButtonText}>Start New Session</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.characterPrompt}>
          Trace: {labeling.currentCharacter?.character ?? ''}
        </Text>
        <Text style={styles.progress}>
          {labeling.currentIndex + 1} / {labeling.totalCharacters}
        </Text>
      </View>

      {/* Canvas */}
      <View style={styles.canvasArea}>
        {labeling.currentCharacter && (
          <TracingCanvas
            svgPath={labeling.currentCharacter.svgPath}
            viewBox={labeling.currentCharacter.viewBox}
            canvasWidth={labeling.canvasWidth}
            canvasHeight={labeling.canvasHeight}
            paths={labeling.paths}
            currentPath={labeling.currentPath}
            isCompleted={false}
            showGuide={true}
            guideOpacity={labeling.guideOpacity}
            drawingEnabled={labeling.saveStatus !== 'saving'}
            showIncorrect={false}
            strokeColor="default"
            onDrawingStart={labeling.onDrawingStart}
            onDrawingActive={labeling.onDrawingActive}
            onDrawingEnd={labeling.onDrawingEnd}
            validateTouchStart={labeling.validateTouchStart}
          />
        )}
      </View>

      {/* Status */}
      <View style={styles.statusArea}>
        {labeling.saveStatus === 'saving' && (
          <Text style={styles.savingText}>Saving...</Text>
        )}
        {labeling.saveStatus === 'error' && (
          <Text style={styles.errorText}>{labeling.errorMessage}</Text>
        )}
        {labeling.saveStatus === 'idle' && !labeling.hasPoints && (
          <Text style={styles.hintText}>Draw the letter above</Text>
        )}
      </View>

      {/* Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, styles.clearButton, labeling.saveStatus === 'saving' && styles.buttonDisabled]}
          onPress={labeling.clearAttempt}
          disabled={labeling.saveStatus === 'saving'}
        >
          <Text style={styles.buttonText}>Clear</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.wrongButton, (!labeling.hasPoints || labeling.saveStatus === 'saving') && styles.buttonDisabled]}
          onPress={() => labeling.submitLabel('wrong')}
          disabled={!labeling.hasPoints || labeling.saveStatus === 'saving'}
        >
          <Text style={styles.buttonText}>✗ Wrong</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.correctButton, (!labeling.hasPoints || labeling.saveStatus === 'saving') && styles.buttonDisabled]}
          onPress={() => labeling.submitLabel('correct')}
          disabled={!labeling.hasPoints || labeling.saveStatus === 'saving'}
        >
          <Text style={styles.buttonText}>✓ Correct</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 8,
  },
  characterPrompt: {
    fontSize: 42,
    fontWeight: '800',
    color: '#1565C0',
    textAlign: 'center',
  },
  progress: {
    fontSize: 16,
    color: '#888',
    marginTop: 4,
  },
  canvasArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusArea: {
    minHeight: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  savingText: { fontSize: 15, color: '#888' },
  errorText: { fontSize: 15, color: '#F44336', textAlign: 'center' },
  hintText: { fontSize: 15, color: '#AAA' },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButton: { backgroundColor: '#FF6B6B' },
  wrongButton: { backgroundColor: '#F44336' },
  correctButton: { backgroundColor: '#4CAF50' },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  doneContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#F5F5F5',
  },
  doneTitle: { fontSize: 32, fontWeight: '800', color: '#1565C0', marginBottom: 12 },
  doneSubtitle: { fontSize: 20, color: '#333', marginBottom: 8 },
  doneInfo: { fontSize: 15, color: '#888', marginBottom: 40 },
  newSessionButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 30,
  },
  newSessionButtonText: { color: '#FFF', fontSize: 18, fontWeight: '700' },
});
```

---

## Stroke Data — Critical

`useDrawing` returns `traceStrokes: TraceStroke[]`. Pass it directly to `saveAttempt` with zero transformation:

```typescript
strokes: drawing.traceStrokes,  // correct — direct pass-through, no mapping, no conversion
```

Each `TracePoint` is `{ x, y, t }` where:
- `x`, `y` are canvas pixel coordinates (0 to canvasWidth / 0 to canvasHeight)
- `t` is ms since that stroke started — first point of every stroke is always `t = 0`

This is identical to what the production app sends to `validateTraceV2`. Training data will be directly compatible.

Always save `canvas_w` and `canvas_h` — the ML model needs these to normalize coordinates across different screen sizes.

---

## Switching to Production Backend Later

Only `src/supabase.ts` needs to change. Replace the `saveAttempt` function body:

```typescript
// Replace supabase insert with:
const response = await fetch('https://your-api.com/labeling/attempts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(attempt),
});
if (!response.ok) throw new Error(`Save failed: ${response.status}`);
```

Nothing else in the app changes.

---

## Pre-launch Checklist

- [ ] Supabase project created, Mumbai region
- [ ] `attempts` table created, RLS disabled
- [ ] `.env` has both Supabase keys
- [ ] `src/characters.ts` has at least one character with a real `svgPath`
- [ ] `TracingCanvas.tsx`, `useDrawing.ts`, `constants.ts`, `svgUtils.ts` copied verbatim from production
- [ ] End-to-end test: draw → tap Correct → confirm row appears in Supabase Table Editor
- [ ] Verify the `strokes` column: array of `{ points: [{x, y, t}] }`, `t` starts at 0 per stroke, `x`/`y` are pixel values within canvas dimensions