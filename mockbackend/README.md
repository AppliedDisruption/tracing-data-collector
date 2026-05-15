# Trainingmock — mock tracing API

Minimal **FastAPI** server that accepts the same JSON body as `tracing-labeler` (`TraceAttemptPayload`) and returns **200** with a small JSON payload.

## Run

On macOS, `pip` is often missing from your shell PATH; use **`python3 -m pip`** (or the venv’s pip after activation).

```bash
cd Trainingmock
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
python3 -m pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Without activating the venv, you can still install and run:

```bash
python3 -m venv .venv
.venv/bin/python3 -m pip install -r requirements.txt
.venv/bin/uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

- Health: `GET http://localhost:8000/health`
- Submit: `POST http://localhost:8000/tracing/trainingdata` with `Content-Type: application/json`

## tracing-labeler `.env`

iOS Simulator / Android emulator on the same machine:

```env
EXPO_PUBLIC_TRACING_ATTEMPTS_URL=http://localhost:8000/tracing/trainingdata
```

Physical device: use your computer’s LAN IP, e.g. `http://192.168.1.10:8000/tracing/trainingdata`.

## Optional Bearer auth

If you set this **before** starting uvicorn, requests must send `Authorization: Bearer <same value>`:

```bash
export TRACING_API_KEY=dev-secret
```

Match in the app:

```env
EXPO_PUBLIC_TRACING_API_KEY=dev-secret
```

If `TRACING_API_KEY` is unset, the mock does **not** require auth.

## Optional logging

```bash
export TRACING_MOCK_LOG_BODY=1
```

## Response shape

**First** POST for an `idempotency_key`:

```json
{
  "ok": true,
  "id": "<uuid>",
  "idempotency_key": "...",
  "deduplicated": false,
  "received": {
    "labeler": "...",
    "character": "...",
    "label": "correct",
    "stroke_count": 1,
    "canvas_w": 300,
    "canvas_h": 346
  }
}
```

**Repeat** same `idempotency_key` (retries): still **200**, same `id`, `"deduplicated": true`.

The Expo client only checks HTTP success; it does not parse this body.
