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

/** Fixed API path — host comes from env (`EXPO_PUBLIC_TRACING_API_BASE_URL`). */
export const TRACING_TRAINING_DATA_PATH = '/tracing/trainingdata';

function normalizeApiBaseUrl(raw: string): string {
  const trimmed = raw.trim().replace(/\/+$/, '');
  if (trimmed.endsWith(TRACING_TRAINING_DATA_PATH)) {
    return trimmed.slice(0, -TRACING_TRAINING_DATA_PATH.length).replace(/\/+$/, '');
  }
  return trimmed;
}

/** Base URL (scheme + host + optional port). Supports legacy `EXPO_PUBLIC_TRACING_ATTEMPTS_URL`. */
export function getTracingApiBaseUrl(): string | undefined {
  const base = process.env.EXPO_PUBLIC_TRACING_API_BASE_URL?.trim();
  if (base) return normalizeApiBaseUrl(base);

  const legacy = process.env.EXPO_PUBLIC_TRACING_ATTEMPTS_URL?.trim();
  if (legacy) return normalizeApiBaseUrl(legacy);

  return undefined;
}

/** Full POST URL for trace attempts. */
export function getTraceAttemptsPostUrl(): string | undefined {
  const base = getTracingApiBaseUrl();
  if (!base) return undefined;
  return `${base}${TRACING_TRAINING_DATA_PATH}`;
}

function errorMessageFromBody(status: number, text: string): string {
  if (!text) return `Request failed (${status})`;
  try {
    const body = JSON.parse(text) as { message?: string; error?: string; detail?: unknown };
    if (typeof body.message === 'string') return body.message;
    if (typeof body.error === 'string') return body.error;
    if (body.detail != null) return JSON.stringify(body.detail);
    return text;
  } catch {
    return text;
  }
}

function logApiResponse(status: number, text: string): void {
  if (!__DEV__) return;
  if (!text) {
    console.log(`[tracing-labeler] response ${status}`);
    return;
  }
  try {
    console.log(`[tracing-labeler] response ${status}:`, JSON.parse(text));
  } catch {
    console.log(`[tracing-labeler] response ${status}:`, text);
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

    const responseText = await response.text();
    logApiResponse(response.status, responseText);

    if (!response.ok) {
      const msg = errorMessageFromBody(response.status, responseText);
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
 * POST one trace attempt. Env: `EXPO_PUBLIC_TRACING_API_BASE_URL` (host only).
 * Optional: `EXPO_PUBLIC_TRACING_API_KEY` → `Authorization: Bearer …`
 */
export async function saveAttempt(attempt: TraceAttemptPayload): Promise<void> {
  const httpUrl = getTraceAttemptsPostUrl();
  if (!httpUrl) {
    throw new Error(
      'Set EXPO_PUBLIC_TRACING_API_BASE_URL in .env to your API host (e.g. https://api.example.com).'
    );
  }
  return postTraceAttemptHttp(httpUrl, attempt);
}
