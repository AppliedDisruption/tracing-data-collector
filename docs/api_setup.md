# Tracing Labeler — Developer Setup Guide

The tracing-labeler is a standalone Expo / React Native app that collects labeled trace
attempts from human labelers. This data will be used to calibrate the tracing validator
in the main EduApp. It is completely separate from the EduApp backend.

**What Rohan has already set up:**
- Supabase project (`tracing-labeler`, Mumbai region) with the `training_data` table,
  RLS enabled, and an anon insert policy
- Infisical project (`tracing-labeler`) with all credentials stored
- `TRACING_API_KEY` generated and stored in Infisical

**What you need to do:**
1. Get credentials from Infisical
2. Deploy the proxy server to Railway
3. Wire the Expo app env vars

---

## 1. Architecture

```
[ tracing-labeler Expo app ]
         │
         │  POST /tracing/trainingdata
         │  Authorization: Bearer <TRACING_API_KEY>
         ▼
[ Proxy server on Railway ]   ← checks TRACING_API_KEY, holds SUPABASE_SERVICE_ROLE_KEY
         │
         │  INSERT INTO training_data
         ▼
[ Supabase Postgres ]
```

The proxy server sits between the app and Supabase so the Supabase service role key
never has to leave the server. The app only knows the `TRACING_API_KEY`.

---

## 2. Get credentials from Infisical

Ask Rohan to invite you to the `tracing-labeler` project on Infisical (`app.infisical.com`).

The project contains these secrets:

| Secret | Used by |
|---|---|
| `SUPABASE_URL` | Proxy server |
| `SUPABASE_ANON_KEY` | Reference only |
| `SUPABASE_SERVICE_ROLE_KEY` | Proxy server — never put this in the Expo app |
| `SUPABASE_DB_PASSWORD` | Reference only |
| `DATABASE_URL` | Proxy server (if connecting directly to Postgres instead of REST) |
| `TRACING_API_KEY` | Proxy server (to validate) + Expo app (to send) |

---

## 3. Deploy the proxy server to Railway

### 3a. Create a new repo

Create a GitHub repo called `tracing-labeler-api`. It needs 3 files.

**`main.py`**
```python
import os
import httpx
from fastapi import FastAPI, HTTPException, Header
from pydantic import BaseModel
from typing import Optional

app = FastAPI()

TRACING_API_KEY = os.environ["TRACING_API_KEY"]
SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_ROLE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]


class Point(BaseModel):
    x: float
    y: float
    t: float

class Stroke(BaseModel):
    points: list[Point]

class TracePayload(BaseModel):
    idempotency_key: str
    labeler: str
    character: str
    label: str
    strokes: list[Stroke]
    canvas_w: int
    canvas_h: int
    svg_path: str
    view_box: str


@app.post("/tracing/trainingdata")
async def save_training_data(
    payload: TracePayload,
    authorization: Optional[str] = Header(None),
):
    if authorization != f"Bearer {TRACING_API_KEY}":
        raise HTTPException(status_code=401, detail="Unauthorized")

    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{SUPABASE_URL}/rest/v1/training_data",
            headers={
                "apikey": SUPABASE_SERVICE_ROLE_KEY,
                "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
                "Content-Type": "application/json",
                "Prefer": "resolution=ignore-duplicates",
            },
            json=payload.model_dump(),
        )

    if response.status_code not in (200, 201):
        raise HTTPException(status_code=500, detail={"message": response.text})

    return {"ok": True, "idempotency_key": payload.idempotency_key}


@app.get("/health")
async def health():
    return {"ok": True}
```

**`requirements.txt`**
```
fastapi
uvicorn
httpx
pydantic
```

**`Procfile`**
```
web: uvicorn main:app --host 0.0.0.0 --port $PORT
```

### 3b. Deploy to Railway

1. Go to [railway.app](https://railway.app) → **New Project → Deploy from GitHub repo** → select `tracing-labeler-api`
2. Railway detects Python automatically and uses the `Procfile`
3. Go to the service → **Variables** tab → add these three (values from Infisical):
   - `TRACING_API_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Railway will build and deploy. Copy the public URL it gives you (e.g. `https://tracing-labeler-api-production.up.railway.app`)

---

## 4. Wire the Expo app

In the `tracing-labeler` repo, create a `.env` file (it should already be gitignored):

```
EXPO_PUBLIC_TRACING_ATTEMPTS_URL=https://<your-railway-url>/tracing/trainingdata
EXPO_PUBLIC_TRACING_API_KEY=<TRACING_API_KEY from Infisical>
```

The app reads these two env vars to know where to POST and what bearer token to send.
See the API contract in `docs/rohan/tracing-labeler-api-contract.md` for the full
request/response shape.

---

## 5. Test end-to-end

Once the proxy is deployed and the Expo app env vars are set, run this curl to verify
the full stack before touching the app:

```bash
curl -X POST https://<your-railway-url>/tracing/trainingdata \
  -H "Authorization: Bearer <TRACING_API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "idempotency_key": "test-001",
    "labeler": "test",
    "character": "A",
    "label": "correct",
    "strokes": [{"points": [{"x": 10, "y": 20, "t": 0}]}],
    "canvas_w": 300,
    "canvas_h": 400,
    "svg_path": "M 30 260 L 130 40 L 230 260",
    "view_box": "0 0 260 300"
  }'
```

Expected response: `{"ok": true, "idempotency_key": "test-001"}`

Then check the Supabase dashboard → Table Editor → `training_data` to confirm the row
appeared. Also test duplicate handling by posting the same `idempotency_key` a second
time — it should return the same 200 response without creating a duplicate row.

---

## 6. Idempotency note

The Expo app has an outbox that retries failed submissions. The proxy uses
`Prefer: resolution=ignore-duplicates` when inserting into Supabase, so a duplicate
`idempotency_key` is silently ignored and still returns 2xx. This is intentional —
a 409 would block the client outbox permanently.

---

## 7. Checklist

- [ ] Invited to `tracing-labeler` project on Infisical
- [ ] `tracing-labeler-api` repo created with `main.py`, `requirements.txt`, `Procfile`
- [ ] Deployed to Railway; `TRACING_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` set as env vars
- [ ] Railway URL noted and added to Expo app `.env` as `EXPO_PUBLIC_TRACING_ATTEMPTS_URL`
- [ ] `EXPO_PUBLIC_TRACING_API_KEY` added to Expo app `.env`
- [ ] curl test passes — row appears in Supabase
- [ ] Duplicate idempotency_key test passes — returns 200, no duplicate row
