import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { flushOutbox, getPendingCount } from '../outbox/outbox';

function paramToString(v: string | string[] | undefined): string | undefined {
  if (v === undefined) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

export default function HomeDashboardScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ labelerName: string }>();
  const labelerName = paramToString(params.labelerName)?.trim() ?? '';

  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  const refreshPending = useCallback(() => {
    void getPendingCount().then(setPendingCount);
  }, []);

  useEffect(() => {
    if (!labelerName) {
      router.replace('/');
    }
  }, [labelerName, router]);

  useFocusEffect(
    useCallback(() => {
      refreshPending();
    }, [refreshPending])
  );

  const handleSync = async () => {
    if (pendingCount === 0 || syncing) return;
    setSyncing(true);
    try {
      await flushOutbox();
    } finally {
      setSyncing(false);
      refreshPending();
    }
  };

  const openTracing = (mode: 'capital' | 'small' | 'digit') => {
    router.push({ pathname: '/trace', params: { labelerName, mode } });
  };

  if (!labelerName) {
    return null;
  }

  return (
    <View style={styles.root}>
      <View style={styles.topBar}>
        <View style={styles.topBarSpacer} />
        {pendingCount > 0 ? (
          <TouchableOpacity
            style={[styles.syncPill, syncing && styles.syncPillDisabled]}
            onPress={handleSync}
            disabled={syncing}
            activeOpacity={0.8}
          >
            {syncing ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <>
                <Text style={styles.syncPillCount}>{pendingCount}</Text>
                <Text style={styles.syncPillLabel}>Sync</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.syncOk}>
            <Text style={styles.syncOkText}>Up to date</Text>
          </View>
        )}
      </View>

      <View style={styles.center}>
        <TouchableOpacity
          style={styles.tracingCard}
          onPress={() => openTracing('capital')}
          activeOpacity={0.9}
        >
          <Text style={styles.tracingTitle}>Trace Capital Letters</Text>
          <Text style={styles.tracingHint}>Practice A-Z uppercase tracing</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tracingCard}
          onPress={() => openTracing('small')}
          activeOpacity={0.9}
        >
          <Text style={styles.tracingTitle}>Trace Small Letters</Text>
          <Text style={styles.tracingHint}>Practice a-z lowercase tracing</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tracingCard}
          onPress={() => openTracing('digit')}
          activeOpacity={0.9}
        >
          <Text style={styles.tracingTitle}>Trace Digits</Text>
          <Text style={styles.tracingHint}>Practice 0-9 number tracing</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    minHeight: 44,
  },
  topBarSpacer: {
    flex: 1,
  },
  syncPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1565C0',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    gap: 8,
  },
  syncPillDisabled: {
    opacity: 0.7,
  },
  syncPillCount: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 15,
  },
  syncPillLabel: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
  syncOk: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  syncOkText: {
    color: '#888',
    fontSize: 13,
    fontWeight: '600',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 14,
  },
  tracingCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minWidth: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  tracingTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1565C0',
    marginBottom: 8,
    textAlign: 'center',
  },
  tracingHint: {
    fontSize: 15,
    color: '#888',
    textAlign: 'center',
  },
});
