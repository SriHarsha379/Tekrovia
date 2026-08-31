import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import Column
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, SQLModel

from app.models.enums import AssessmentType, GateStatus, MockType, ReadinessClassification


class Assessment(SQLModel, table=True):
    """Free assessment, module quiz, AI mock diagnostic, or formal readiness test."""

    __tablename__ = "assessments"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    candidate_id: uuid.UUID = Field(foreign_key="candidates.id", index=True)
    type: AssessmentType
    related_module_id: uuid.UUID | None = Field(default=None, foreign_key="modules.id")
    score: Decimal | None = None
    max_score: Decimal | None = None
    # e.g. {"theory": 4, "logical": 5, "practical": 3}
    breakdown: dict | None = Field(default=None, sa_column=Column(JSONB))
    classification: ReadinessClassification | None = None  # only for formal_readiness
    taken_at: datetime = Field(default_factory=datetime.utcnow)


class MockInterview(SQLModel, table=True):
    __tablename__ = "mock_interviews"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    candidate_id: uuid.UUID = Field(foreign_key="candidates.id", index=True)
    type: MockType
    mock_number: int | None = None  # 1,2,3 for expert mocks; null for AI practice
    interviewer_id: uuid.UUID | None = Field(default=None, foreign_key="users.id")
    is_final_mock: bool = Field(default=False)
    score: Decimal | None = None
    feedback: str | None = None
    conducted_at: datetime = Field(default_factory=datetime.utcnow)


class Resume(SQLModel, table=True):
    __tablename__ = "resumes"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    candidate_id: uuid.UUID = Field(foreign_key="candidates.id", index=True)
    file_url: str
    version: int = Field(default=1)
    ats_score: Decimal | None = None
    reviewed_by: uuid.UUID | None = Field(default=None, foreign_key="users.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ReadinessGate(SQLModel, table=True):
    """
    Snapshot table — a new row each time projects/mocks/scores are re-evaluated,
    so gate history is preserved (useful for the four-interview recovery rule).
    """

    __tablename__ = "readiness_gates"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    candidate_id: uuid.UUID = Field(foreign_key="candidates.id", index=True)
    projects_complete: bool = Field(default=False)
    mocks_complete: bool = Field(default=False)
    formal_score: Decimal | None = None
    final_mock_score: Decimal | None = None
    status: GateStatus = Field(default=GateStatus.pending)
    evaluated_at: datetime = Field(default_factory=datetime.utcnow)
