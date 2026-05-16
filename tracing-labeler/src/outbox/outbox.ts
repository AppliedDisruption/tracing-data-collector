/**
 * Local outbox: enqueue trace attempts to AsyncStorage, flush sequentially via HTTP.
 * No AppState, no backoff, no queue cap. See plan in repo discussion.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { TraceAttemptPayload } from '../api/traceAttempts';
import { getTraceAttemptsPostUrl, saveAttempt } from '../api/traceAttempts';

const OUTBOX_STORAGE_KEY = '@tracing_labeler_outbox_v1';

export type OutboxItem = {
  idempotency_key: string;
  payload: TraceAttemptPayload;
  created_at: string;
};

export function newIdempotencyKey(): string {
  const c = globalThis.crypto;
  if (c?.getRandomValues) {
    const b = new Uint8Array(16);
    c.getRandomValues(b);
    b[6] = (b[6]! & 0x0f) | 0x40;
    b[8] = (b[8]! & 0x3f) | 0x80;
    const h = Array.from(b, x => x.toString(16).padStart(2, '0')).join('');
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
  }
  return `idem-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

async function readQueue(): Promise<OutboxItem[]> {
  try {
    const raw = await AsyncStorage.getItem(OUTBOX_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed as OutboxItem[];
  } catch {
    if (__DEV__) {
      console.warn('[outbox] corrupt storage, resetting queue');
    }
    await AsyncStorage.removeItem(OUTBOX_STORAGE_KEY);
    return [];
  }
}

async function writeQueue(items: OutboxItem[]): Promise<void> {
  await AsyncStorage.setItem(OUTBOX_STORAGE_KEY, JSON.stringify(items));
}

/** Append one attempt. `payload.idempotency_key` must be set (stable for all retries). */
export async function enqueueTraceAttempt(payload: TraceAttemptPayload): Promise<void> {
  const key = payload.idempotency_key?.trim();
  if (!key) {
    throw new Error('TraceAttemptPayload.idempotency_key is required');
  }
  const queue = await readQueue();
  queue.push({
    idempotency_key: key,
    payload: { ...payload, idempotency_key: key },
    created_at: new Date().toISOString(),
  });
  await writeQueue(queue);
}

export async function getPendingCount(): Promise<number> {
  const q = await readQueue();
  return q.length;
}

let flushTail: Promise<void> = Promise.resolve();

/**
 * POST queue head repeatedly until empty or first failure. Serialized across callers.
 */
export function flushOutbox(): Promise<void> {
  const run = async (): Promise<void> => {
    if (!getTraceAttemptsPostUrl()) {
      if (__DEV__) {
        console.warn('[outbox] skip flush: EXPO_PUBLIC_TRACING_API_BASE_URL not set');
      }
      return;
    }

    for (;;) {
      const queue = await readQueue();
      if (queue.length === 0) return;

      const head = queue[0]!;
      try {
        await saveAttempt(head.payload);
        await writeQueue(queue.slice(1));
      } catch {
        return;
      }
    }
  };

  const p = flushTail.then(run);
  flushTail = p.catch(() => {});
  return p;
}
