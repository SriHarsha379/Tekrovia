import uuid
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Column, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, SQLModel

from app.models.enums import ChannelType, LeadStatus


class Campaign(SQLModel, table=True):
    __tablename__ = "campaigns"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(max_length=150)
    channel: ChannelType
    target_audience: str | None = Field(default=None, max_length=255)
    utm_source: str | None = Field(default=None, max_length=100)
    utm_medium: str | None = Field(default=None, max_length=100)
    utm_campaign: str | None = Field(default=None, max_length=100)
    utm_content: str | None = Field(default=None, max_length=100)
    utm_term: str | None = Field(default=None, max_length=100)
    budget: Decimal | None = None
    start_date: date | None = None
    end_date: date | None = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Lead(SQLModel, table=True):
    __tablename__ = "leads"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    campaign_id: uuid.UUID | None = Field(default=None, foreign_key="campaigns.id")
    name: str | None = Field(default=None, max_length=150)
    phone: str | None = Field(default=None, max_length=20, index=True)
    email: str | None = Field(default=None, max_length=150, index=True)
    landing_page_url: str | None = None
    status: LeadStatus = Field(default=LeadStatus.new)
    metadata_: dict | None = Field(default=None, sa_column=Column("metadata", JSONB))
    # use_alter=True breaks the leads<->candidates circular FK: this constraint is
    # created via a separate ALTER TABLE after both tables exist, instead of inline.
    converted_candidate_id: uuid.UUID | None = Field(
        default=None,
        sa_column=Column(
            ForeignKey("candidates.id", use_alter=True, name="fk_leads_converted_candidate_id"),
        ),
    )
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class FunnelEvent(SQLModel, table=True):
    """Append-only event log powering the marketing funnel dashboard."""

    __tablename__ = "funnel_events"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    lead_id: uuid.UUID | None = Field(default=None, foreign_key="leads.id")
    candidate_id: uuid.UUID | None = Field(default=None, foreign_key="candidates.id")
    campaign_id: uuid.UUID | None = Field(default=None, foreign_key="campaigns.id")
    event_type: str = Field(max_length=50, index=True)
    metadata_: dict | None = Field(default=None, sa_column=Column("metadata", JSONB))
    occurred_at: datetime = Field(default_factory=datetime.utcnow, index=True)