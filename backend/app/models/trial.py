import uuid
from datetime import datetime

from sqlalchemy import Column
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, SQLModel

from app.models.enums import AutomationChannel, AutomationTrigger, TrialSessionStatus


class TrialProgress(SQLModel, table=True):
    __tablename__ = "trial_progress"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    candidate_id: uuid.UUID = Field(foreign_key="candidates.id", index=True)
    session_number: int = Field(ge=1, le=3)
    status: TrialSessionStatus = Field(default=TrialSessionStatus.scheduled)
    lab_completed: bool = Field(default=False)
    scheduled_at: datetime | None = None
    completed_at: datetime | None = None


class AutomationEvent(SQLModel, table=True):
    """Log of every WhatsApp/email trigger fired for the trial sequence."""

    __tablename__ = "automation_events"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    candidate_id: uuid.UUID = Field(foreign_key="candidates.id", index=True)
    trigger_type: AutomationTrigger
    channel: AutomationChannel
    status: str = Field(default="sent", max_length=20)
    payload: dict | None = Field(default=None, sa_column=Column(JSONB))
    sent_at: datetime = Field(default_factory=datetime.utcnow)
