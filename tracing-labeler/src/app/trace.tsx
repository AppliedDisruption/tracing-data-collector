import { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TracingCanvas } from '../trace/TracingCanvas';
import { useTraceSession } from '../trace/useTraceSession';
import { getShuffledCharacters, type TraceMode } from '../trace/characters';
import { getTracingCanvasWidth } from '../trace/getTracingCanvasWidth';

/** Main screen: draw a letter, mark correct/wrong, POST to backend. Route: `/trace`. */
export default function TraceScreen() {
  const { labelerName, mode } = useLocalSearchParams<{ labelerName: string; mode?: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const traceMode: TraceMode =
    mode === 'small' || mode === 'digit' || mode === 'capital' ? mode : 'capital';

  const characters = useMemo(() => getShuffledCharacters(traceMode), [traceMode]);

  const canvasWidth = getTracingCanvasWidth(width);

  const session = useTraceSession({
    labelerName: labelerName ?? 'unknown',
    characters,
    canvasWidth,
  });

  const goHome = () => {
    router.replace({
      pathname: '/home',
      params: { labelerName: labelerName ?? 'unknown' },
    });
  };

  if (session.isDone) {
    return (
      <View style={styles.doneContainer}>
        <TouchableOpacity
          style={styles.homeIconDone}
          onPress={goHome}
          accessibilityRole="button"
          accessibilityLabel="Home"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="home-outline" size={24} color="#1565C0" />
        </TouchableOpacity>
        <Text style={styles.doneTitle}>Session Complete!</Text>
        <Text style={styles.doneSubtitle}>You saved {session.totalSaved} traces</Text>
        <Text style={styles.doneInfo}>
          {traceMode === 'capital'
            ? 'Capital letters completed'
            : traceMode === 'small'
              ? 'Small letters completed'
              : 'Digits completed'}
        </Text>
        <TouchableOpacity style={styles.newSessionButton} onPress={goHome}>
          <Text style={styles.newSessionButtonText}>Back to home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.homeIconCell}
          onPress={goHome}
          accessibilityRole="button"
          accessibilityLabel="Home"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="home-outline" size={24} color="#1565C0" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.modeLabel}>
            {traceMode === 'capital'
              ? 'Capital Letters'
              : traceMode === 'small'
                ? 'Small Letters'
                : 'Digits'}
          </Text>
          <Text style={styles.characterPrompt}>
            Trace: {session.currentCharacter?.character ?? ''}
          </Text>
          <Text style={styles.progress}>
            {session.currentIndex + 1} / {session.totalCharacters}
          </Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.canvasArea}>
        {session.currentCharacter && (
          <TracingCanvas
            svgPath={session.currentCharacter.svgPath}
            viewBox={session.currentCharacter.viewBox}
            canvasWidth={session.canvasWidth}
            canvasHeight={session.canvasHeight}
            paths={session.paths}
            currentPath={session.currentPath}
            isCompleted={false}
            showGuide={true}
            guideOpacity={session.guideOpacity}
            drawingEnabled={session.saveStatus !== 'saving'}
            showIncorrect={false}
            strokeColor="default"
            onDrawingStart={session.onDrawingStart}
            onDrawingActive={session.onDrawingActive}
            onDrawingEnd={session.onDrawingEnd}
            validateTouchStart={session.validateTouchStart}
          />
        )}
      </View>

      <View style={styles.statusArea}>
        {session.saveStatus === 'saving' && <Text style={styles.savingText}>Saving...</Text>}
        {session.saveStatus === 'error' && (
          <Text style={styles.errorText}>{session.errorMessage}</Text>
        )}
        {session.saveStatus === 'idle' && !session.hasPoints && (
          <Text style={styles.hintText}>
            Draw the {traceMode === 'digit' ? 'digit' : 'letter'} above
          </Text>
        )}
      </View>

      <SafeAreaView edges={['bottom']}>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[
              styles.button,
              styles.clearButton,
              session.saveStatus === 'saving' && styles.buttonDisabled,
            ]}
            onPress={session.clearAttempt}
            disabled={session.saveStatus === 'saving'}
          >
            <Text style={styles.buttonText}>Clear</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              styles.wrongButton,
              (!session.hasPoints || session.saveStatus === 'saving') && styles.buttonDisabled,
            ]}
            onPress={() => session.submitTrace('wrong')}
            disabled={!session.hasPoints || session.saveStatus === 'saving'}
          >
            <Text style={styles.buttonText}>✗ Wrong</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              styles.correctButton,
              (!session.hasPoints || session.saveStatus === 'saving') && styles.buttonDisabled,
            ]}
            onPress={() => session.submitTrace('correct')}
            disabled={!session.hasPoints || session.saveStatus === 'saving'}
          >
            <Text style={styles.buttonText}>✓ Correct</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  homeIconCell: {
    width: 36,
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerSpacer: {
    width: 36,
  },
  characterPrompt: {
    fontSize: 42,
    fontWeight: '800',
    color: '#1565C0',
    textAlign: 'center',
  },
  modeLabel: {
    fontSize: 14,
    color: '#888',
    fontWeight: '700',
    marginBottom: 4,
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
    paddingBottom: 12,
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
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
    backgroundColor: '#F5F5F5',
  },
  homeIconDone: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 52 : 32,
    left: 20,
    padding: 4,
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
