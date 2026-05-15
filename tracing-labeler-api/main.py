import os
import httpx
from fastapi import FastAPI, HTTPException, Header
from pydantic import BaseModel
from typing import Optional

app = FastAPI()

TRACING_API_KEY = os.environ["TRACING_API_KEY"]
SUPABASE_SERVICE_ROLE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]


def training_data_url() -> str:
    """Accept base URL or .../rest/v1 from Infisical; always POST to .../rest/v1/training_data."""
    base = os.environ["SUPABASE_URL"].rstrip("/")
    if base.endswith("/rest/v1"):
        return f"{base}/training_data"
    return f"{base}/rest/v1/training_data"


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
            training_data_url(),
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
