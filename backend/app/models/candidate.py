import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import ARRAY, Column, String
from sqlmodel import Field, SQLModel

from app.models.enums import CandidateClassification


class Candidate(SQLModel, table=True):
    """
    The single source-of-truth identity threaded through every other table —
    one Candidate ID across marketing, LMS, support, assessments and placement.
    """

    __tablename__ = "candidates"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    candidate_code: str = Field(max_length=20, unique=True, index=True)  # e.g. TKR-2026-000123
    lead_id: uuid.UUID | None = Field(default=None, foreign_key="leads.id")
    full_name: str = Field(max_length=150)
    email: str | None = Field(default=None, max_length=150, unique=True)
    phone: str | None = Field(default=None, max_length=20, unique=True)
    classification: CandidateClassification | None = None
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class Registration(SQLModel, table=True):
    __tablename__ = "registrations"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    candidate_id: uuid.UUID = Field(foreign_key="candidates.id", index=True)
    education: str | None = Field(default=None, max_length=150)
    graduation_year: int | None = None
    experience_years: Decimal | None = None
    current_skills: list[str] | None = Field(default=None, sa_column=Column(ARRAY(String)))
    earlier_training: str | None = None
    career_gap_months: int | None = None
    target_role: str | None = Field(default=None, max_length=150)
    coding_preference: str | None = Field(default=None, max_length=100)
    resume_url: str | None = None
    learning_availability: str | None = Field(default=None, max_length=100)
    chosen_schedule: str | None = Field(default=None, max_length=100)
    campaign_source_id: uuid.UUID | None = Field(default=None, foreign_key="campaigns.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
