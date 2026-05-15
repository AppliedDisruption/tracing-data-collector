"""
Mock tracing training-data API for tracing-labeler.

POST JSON body matches TraceAttemptPayload (see tracing-labeler/src/api/traceAttempts.ts).
"""

from __future__ import annotations

import os
import uuid
from typing import Literal

from fastapi import FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

EXPECTED_BEARER = os.environ.get("TRACING_API_KEY", "").strip()


class TracePoint(BaseModel):
    x: float
    y: float
    t: float


class TraceStroke(BaseModel):
    points: list[TracePoint]


class TraceAttemptPayload(BaseModel):
    idempotency_key: str = Field(..., min_length=1)
    labeler: str
    character: str
    label: Literal["correct", "wrong"]
    strokes: list[TraceStroke]
    canvas_w: int
    canvas_h: int
    svg_path: str
    view_box: str


app = FastAPI(title="Training mock — tracing trainingdata")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# idempotency_key -> server id (mock dedupe)
_store: dict[str, uuid.UUID] = {}


def _check_bearer(authorization: str | None) -> None:
    if not EXPECTED_BEARER:
        return
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Authorization: Bearer …")
    token = authorization.removeprefix("Bearer ").strip()
    if token != EXPECTED_BEARER:
        raise HTTPException(status_code=403, detail="Invalid API key")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/tracing/trainingdata")
def submit_trace_trainingdata(
    request: Request,
    body: TraceAttemptPayload,
    authorization: str | None = Header(default=None, alias="Authorization"),
) -> dict:
    """
    Accepts one labeled trace attempt. Same idempotency_key returns the same id (200).
    """
    _check_bearer(authorization)

    key = body.idempotency_key.strip()
    if key in _store:
        existing = _store[key]
        return {
            "ok": True,
            "id": str(existing),
            "idempotency_key": key,
            "deduplicated": True,
            "message": "Already accepted (mock replay)",
        }

    new_id = uuid.uuid4()
    _store[key] = new_id

    if os.environ.get("TRACING_MOCK_LOG_BODY", "").strip() in ("1", "true", "yes"):
        print(f"[mock] accepted attempt id={new_id} character={body.character!r} label={body.label}")

    return {
        "ok": True,
        "id": str(new_id),
        "idempotency_key": key,
        "deduplicated": False,
        "received": {
            "labeler": body.labeler,
            "character": body.character,
            "label": body.label,
            "stroke_count": len(body.strokes),
            "canvas_w": body.canvas_w,
            "canvas_h": body.canvas_h,
        },
    }
