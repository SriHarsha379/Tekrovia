from __future__ import annotations

import logging
import os
from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware

from config import AI_SERVICE_SECRET
from roadmap import RoadmapRequest, RoadmapResponse, generate_roadmap
from mock_interview import MockRequest, MockResponse, generate_mock_questions
from resume_review import ResumeRequest, ResumeResponse, review_resume
from doubt_assistant import DoubtRequest, DoubtResponse, answer_doubt

logger = logging.getLogger("ai-service")

app = FastAPI(
    title="TekRovia AI Service",
    version="1.0.0",
    description="AI layer: roadmap generation, mock interviews, resume review, doubt assistant.",
    # ✅ Fix #9 — disable FastAPI's default exception detail passthrough in production
    docs_url="/docs" if os.getenv("NODE_ENV") != "production" else None,
    redoc_url=None,
)

# ✅ Fix #13 — CORS origins from environment variable, not hardcoded
_raw_origins = os.getenv(
    "AI_CORS_ORIGINS",
    "http://localhost:3001,http://localhost:3000",
)
_allowed_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)


def verify_secret(x_ai_secret: str | None) -> None:
    """
    Internal requests from NestJS must pass the shared secret.

    ✅ Fix #3 — fail-closed: if the secret is not configured the
    service refuses all requests instead of accepting them all.
    """
    if not AI_SERVICE_SECRET:
        logger.critical(
            "AI_SERVICE_SECRET is not set. "
            "All requests are being rejected until it is configured."
        )
        raise HTTPException(
            status_code=503,
            detail="Service is not configured. Contact the administrator.",
        )
    if x_ai_secret != AI_SERVICE_SECRET:
        raise HTTPException(status_code=401, detail="Unauthorized.")


# ── Health ────────────────────────────────────────────────────────────────────

@app.get("/health")
def health() -> dict:
    return {
        "status": "ok",
        "service": "ai-service",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


# ── Roadmap ───────────────────────────────────────────────────────────────────

@app.post("/api/v1/roadmap", response_model=RoadmapResponse)
async def roadmap(
    request: RoadmapRequest,
    x_ai_secret: str | None = Header(default=None),
) -> RoadmapResponse:
    verify_secret(x_ai_secret)
    try:
        return await generate_roadmap(request)
    except Exception:
        # ✅ Fix #9 — log internally, never surface exception details to caller
        logger.exception("Roadmap generation failed")
        raise HTTPException(status_code=500, detail="Roadmap generation failed.")


# ── Mock Interview ────────────────────────────────────────────────────────────

@app.post("/api/v1/mock-interview", response_model=MockResponse)
async def mock_interview(
    request: MockRequest,
    x_ai_secret: str | None = Header(default=None),
) -> MockResponse:
    verify_secret(x_ai_secret)
    try:
        return await generate_mock_questions(request)
    except Exception:
        logger.exception("Mock interview generation failed")
        raise HTTPException(status_code=500, detail="Mock interview generation failed.")


# ── Resume Review ─────────────────────────────────────────────────────────────

@app.post("/api/v1/resume-review", response_model=ResumeResponse)
async def resume_review(
    request: ResumeRequest,
    x_ai_secret: str | None = Header(default=None),
) -> ResumeResponse:
    verify_secret(x_ai_secret)
    try:
        return await review_resume(request)
    except Exception:
        logger.exception("Resume review failed")
        raise HTTPException(status_code=500, detail="Resume review failed.")


# ── Doubt Assistant ───────────────────────────────────────────────────────────

@app.post("/api/v1/doubt", response_model=DoubtResponse)
async def doubt(
    request: DoubtRequest,
    x_ai_secret: str | None = Header(default=None),
) -> DoubtResponse:
    verify_secret(x_ai_secret)
    try:
        return await answer_doubt(request)
    except Exception:
        logger.exception("Doubt assistant failed")
        raise HTTPException(status_code=500, detail="Doubt assistant failed.")
