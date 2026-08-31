"""
Candidates router — read-mostly here; creation happens inside the auth/OTP flow
(app/routers/auth.py) since a candidate is only created on first successful login.
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session

from app.core.database import get_session
from app.models.candidate import Candidate

router = APIRouter(prefix="/candidates", tags=["candidates"])


class CandidateRead(BaseModel):
    id: uuid.UUID
    candidate_code: str
    full_name: str
    email: str | None
    phone: str | None


@router.get("/{candidate_id}", response_model=CandidateRead)
def get_candidate(candidate_id: uuid.UUID, session: Session = Depends(get_session)):
    candidate = session.get(Candidate, candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return candidate
