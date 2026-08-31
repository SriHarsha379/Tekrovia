import uuid
from datetime import datetime

from sqlmodel import Field, SQLModel

from app.models.enums import StaffRole


class User(SQLModel, table=True):
    """Internal staff — admin, trainer, mentor, support, marketing, placement."""

    __tablename__ = "users"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(max_length=150)
    email: str = Field(max_length=150, unique=True, index=True)
    phone: str | None = Field(default=None, max_length=20)
    role: StaffRole
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class OTPVerification(SQLModel, table=True):
    """OTP login for candidates — phone or email based."""

    __tablename__ = "otp_verifications"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    identifier: str = Field(max_length=150, index=True)  # phone or email
    otp_code_hash: str = Field(max_length=255)
    purpose: str = Field(default="login", max_length=30)
    expires_at: datetime
    verified_at: datetime | None = None
    attempt_count: int = Field(default=0)
    created_at: datetime = Field(default_factory=datetime.utcnow)
