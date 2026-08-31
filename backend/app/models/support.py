import uuid
from datetime import datetime

from sqlmodel import Field, SQLModel

from app.models.enums import TicketCategory, TicketStatus


class SupportTicket(SQLModel, table=True):
    __tablename__ = "support_tickets"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    candidate_id: uuid.UUID = Field(foreign_key="candidates.id", index=True)
    category: TicketCategory
    subject: str = Field(max_length=200)
    description: str | None = None
    status: TicketStatus = Field(default=TicketStatus.open, index=True)
    assigned_to: uuid.UUID | None = Field(default=None, foreign_key="users.id")
    sla_due_at: datetime | None = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    resolved_at: datetime | None = None


class TicketComment(SQLModel, table=True):
    __tablename__ = "ticket_comments"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    ticket_id: uuid.UUID = Field(foreign_key="support_tickets.id", index=True)
    author_user_id: uuid.UUID | None = Field(default=None, foreign_key="users.id")
    author_candidate_id: uuid.UUID | None = Field(default=None, foreign_key="candidates.id")
    message: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
