from __future__ import annotations
from datetime import datetime, timezone
from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from config import AI_SERVICE_SECRET
from roadmap import RoadmapRequest, RoadmapResponse, generate_roadmap
from mock_interview import MockRequest, MockResponse, generate_mock_questions
from resume_review import ResumeRequest, ResumeResponse, review_resume
from doubt_assistant import DoubtRequest, DoubtResponse, answer_doubt

app = FastAPI(
    title="TekRovia AI Service",
    version="1.0.0",
    description="AI layer: roadmap generation, mock interviews, resume review, doubt assistant.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def verify_secret(x_ai_secret: str | None):
    """Internal requests from NestJS must pass the shared secret."""
    if AI_SERVICE_SECRET and x_ai_secret != AI_SERVICE_SECRET:
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
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Roadmap generation failed: {str(e)}")


# ── Mock Interview ────────────────────────────────────────────────────────────

@app.post("/api/v1/mock-interview", response_model=MockResponse)
async def mock_interview(
    request: MockRequest,
    x_ai_secret: str | None = Header(default=None),
) -> MockResponse:
    verify_secret(x_ai_secret)
    try:
        return await generate_mock_questions(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Mock generation failed: {str(e)}")


# ── Resume Review ─────────────────────────────────────────────────────────────

@app.post("/api/v1/resume-review", response_model=ResumeResponse)
async def resume_review(
    request: ResumeRequest,
    x_ai_secret: str | None = Header(default=None),
) -> ResumeResponse:
    verify_secret(x_ai_secret)
    try:
        return await review_resume(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Resume review failed: {str(e)}")


# ── Doubt Assistant ───────────────────────────────────────────────────────────

@app.post("/api/v1/doubt", response_model=DoubtResponse)
async def doubt(
    request: DoubtRequest,
    x_ai_secret: str | None = Header(default=None),
) -> DoubtResponse:
    verify_secret(x_ai_secret)
    try:
        return await answer_doubt(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Doubt assistant failed: {str(e)}")
