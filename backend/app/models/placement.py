import uuid
from datetime import date, datetime

from sqlalchemy import Column
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, SQLModel

from app.models.enums import PipelineStage, RecoveryStatus, SubmissionChannel


class JobPosting(SQLModel, table=True):
    __tablename__ = "job_postings"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    client_name: str = Field(max_length=150)
    role_title: str = Field(max_length=150)
    job_description: str | None = None
    job_link: str | None = None
    location: str | None = Field(default=None, max_length=100)
    created_by: uuid.UUID | None = Field(default=None, foreign_key="users.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)


class JobMatch(SQLModel, table=True):
    __tablename__ = "job_matches"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    candidate_id: uuid.UUID = Field(foreign_key="candidates.id", index=True)
    job_posting_id: uuid.UUID = Field(foreign_key="job_postings.id")
    match_evidence: dict | None = Field(default=None, sa_column=Column(JSONB))
    created_at: datetime = Field(default_factory=datetime.utcnow)


class PlacementSubmission(SQLModel, table=True):
    """The 11-stage placement pipeline: profile_review -> ... -> joined."""

    __tablename__ = "placement_submissions"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    candidate_id: uuid.UUID = Field(foreign_key="candidates.id", index=True)
    job_posting_id: uuid.UUID | None = Field(default=None, foreign_key="job_postings.id")
    stage: PipelineStage = Field(default=PipelineStage.profile_review, index=True)
    channel: SubmissionChannel | None = None
    blocker: str | None = None
    next_action: str | None = None
    rejection_reason: str | None = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class InterviewRound(SQLModel, table=True):
    __tablename__ = "interview_rounds"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    submission_id: uuid.UUID = Field(foreign_key="placement_submissions.id", index=True)
    round_number: int
    scheduled_at: datetime | None = None
    outcome: str | None = Field(default=None, max_length=50)  # pending, cleared, rejected
    feedback: str | None = None


class PlacementRecovery(SQLModel, table=True):
    """Four-interview recovery rule tracking."""

    __tablename__ = "placement_recovery"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    candidate_id: uuid.UUID = Field(foreign_key="candidates.id", index=True)
    rejection_count: int = Field(default=0)
    paused_at: datetime | None = None
    brushup_start: date | None = None
    brushup_end: date | None = None
    repeat_mock_id: uuid.UUID | None = Field(default=None, foreign_key="mock_interviews.id")
    resumed_at: datetime | None = None
    status: RecoveryStatus = Field(default=RecoveryStatus.active)
    created_at: datetime = Field(default_factory=datetime.utcnow)
