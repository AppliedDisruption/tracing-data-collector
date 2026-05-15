import type { TraceStroke } from '../trace/tracingContracts';

/** Payload sent to the tracing HTTP API — keep fields aligned with backend. */
export type TraceAttemptPayload = {
  /** UUID per attempt; same on every retry so the server can dedupe (unique constraint). */
  idempotency_key: string;
  labeler: string;
  character: string;
  label: 'correct' | 'wrong';
  strokes: TraceStroke[];
  /** Logical pixel width/height; send integers (rounded) in JSON. */
  canvas_w: number;
  canvas_h: number;
  svg_path: string;
  view_box: string;
};

const DEFAULT_TIMEOUT_MS = 30_000;

async function readErrorMessage(response: Response): Promise<string> {
  const text = await response.text();
  if (!text) return `Request failed (${response.status})`;
  try {
    const body = JSON.parse(text) as { message?: string; error?: string };
    return body.message ?? body.error ?? text;
  } catch {
    return text;
  }
}

async function postTraceAttemptHttp(url: string, attempt: TraceAttemptPayload): Promise<void> {
  const apiKey = process.env.EXPO_PUBLIC_TRACING_API_KEY?.trim();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(attempt),
      signal: controller.signal,
    });

    if (!response.ok) {
      const msg = await readErrorMessage(response);
      throw new Error(msg || `Save failed (${response.status})`);
    }
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      throw new Error('Save timed out');
    }
    throw e;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * POST one trace attempt to `EXPO_PUBLIC_TRACING_ATTEMPTS_URL` (full URL).
 * Optional: `EXPO_PUBLIC_TRACING_API_KEY` → `Authorization: Bearer …`
 */
export async function saveAttempt(attempt: TraceAttemptPayload): Promise<void> {
  const httpUrl = process.env.EXPO_PUBLIC_TRACING_ATTEMPTS_URL?.trim();
  if (!httpUrl) {
    throw new Error(
      'Set EXPO_PUBLIC_TRACING_ATTEMPTS_URL in .env to your backend POST URL (e.g. https://api.example.com/tracing/trainingdata).'
    );
  }
  if (__DEV__) {
    console.log('[tracing-labeler] POST body (same JSON as request):', JSON.stringify(attempt, null, 2));
  }
  return postTraceAttemptHttp(httpUrl, attempt);
}
