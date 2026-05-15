# Tracing labeler — HTTP API contract

Mobile app: **tracing-labeler** (Expo / React Native).  
This document describes the **single endpoint** the app uses to submit one labeled trace (“training data”) per request.

---

## Endpoint

- **Method:** `POST`
- **URL:** Configurable **full URL** (no path assumed by the client beyond what you deploy).  
  Example path used in development: **`/tracing/trainingdata`**  
  Example: `https://api.yourcompany.com/tracing/trainingdata`
- The app reads the URL from env: **`EXPO_PUBLIC_TRACING_ATTEMPTS_URL`** (must include scheme, host, optional port, and path).

---

## Headers

| Header | Required | Description |
|--------|----------|-------------|
| `Content-Type` | Yes | `application/json` |
| `Accept` | Yes | `application/json` |
| `Authorization` | Optional | If the app is configured with `EXPO_PUBLIC_TRACING_API_KEY`, sends `Authorization: Bearer <token>`. If unset, no auth header is sent. |

---

## Request body (JSON)

One object per request — **trace attempt / training data payload**.

### Schema (field names are exact; snake_case)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `idempotency_key` | string | Yes | UUID (or UUID-like) per attempt. **Same value on every retry** for the same logical submit. Server should treat it as **unique** (dedupe / upsert). |
| `labeler` | string | Yes | Human-readable labeler name from the app gate screen. |
| `character` | string | Yes | Single character being traced (e.g. `"A"`). |
| `label` | string | Yes | Either **`"correct"`** or **`"wrong"`** (literal strings). |
| `strokes` | array | Yes | Ordered list of strokes for this attempt. See **Stroke structure** below. |
| `canvas_w` | integer | Yes | Canvas width in **logical pixels** (integer in JSON). |
| `canvas_h` | integer | Yes | Canvas height in **logical pixels** (integer in JSON). |
| `svg_path` | string | Yes | SVG `d` attribute for the guide glyph (same space as `view_box`). |
| `view_box` | string | Yes | SVG `viewBox` string, e.g. `"0 0 260 300"`. |

### Stroke structure

```json
"strokes": [
  {
    "points": [
      { "x": 120.5, "y": 200.0, "t": 0 },
      { "x": 121.0, "y": 199.5, "t": 16.2 }
    ]
  }
]
```

| Field | Type | Description |
|-------|------|-------------|
| `strokes[].points` | array | Points in **canvas / logical pixel** coordinates (same space as `canvas_w` × `canvas_h`). |
| `points[].x` | number | X in pixels. |
| `points[].y` | number | Y in pixels. |
| `points[].t` | number | Milliseconds **since the start of that stroke** (from `performance.now()`). First point is typically `0`; monotonic within the stroke. |

Empty `points` arrays should not appear for successful submits from the current UI (user must draw before submit).

---

## Idempotency & retries

- The client **outbox** may POST the **same JSON** again if the network fails after enqueue, or when the user triggers sync.
- **`idempotency_key` must be stable** for that attempt across retries.
- Recommended server behavior: **unique constraint** on `idempotency_key`; on duplicate, return **2xx** (same logical success) or **409** — note: today the app treats **only 2xx** as success for dequeue; **409 would block the outbox** until you align client behavior.

---

## Client behavior (for backend design)

- **Timeout:** ~30 seconds per request.
- **Success:** Any HTTP **2xx** with a body is fine; the client **does not require** a specific JSON response shape today.
- **Failure:** Non-2xx → client surfaces error text from JSON keys **`message`** or **`error`**, or raw response text.

---

## Suggested HTTP responses

### Success (200–299)

Optional JSON example:

```json
{
  "id": "<server-generated-uuid>",
  "idempotency_key": "<echo>",
  "ok": true
}
```

### Client-parseable errors (4xx / 5xx)

JSON preferred:

```json
{ "message": "Human-readable error" }
```

or

```json
{ "error": "Human-readable error" }
```

---

## Reference: Postgres-shaped storage

If you map 1:1 to a table, the app’s payload aligns with columns like:

| Column | Source field |
|--------|----------------|
| `idempotency_key` | `idempotency_key` |
| `labeler` | `labeler` |
| `character` | `character` |
| `label` | `label` |
| `strokes` | `strokes` (store as JSONB) |
| `canvas_w` | `canvas_w` |
| `canvas_h` | `canvas_h` |
| `svg_path` | `svg_path` |
| `view_box` | `view_box` |

See `tracing-labeler/schema/attempts.sql` for an example DDL.

---

## Versioning

Path versioning (e.g. `/v1/...`) is **not** required by the client; the **full URL** is supplied via env. You may host under `/v1/tracing/trainingdata` or `/tracing/trainingdata` as long as the deployed URL matches `EXPO_PUBLIC_TRACING_ATTEMPTS_URL`.

---

## Contact / source of truth

- TypeScript types: `tracing-labeler/src/api/traceAttempts.ts` (`TraceAttemptPayload`), `tracing-labeler/src/trace/tracingContracts.ts` (`TraceStroke`, `TracePoint`).
- HTTP implementation: `tracing-labeler/src/api/traceAttempts.ts` (`saveAttempt`).
