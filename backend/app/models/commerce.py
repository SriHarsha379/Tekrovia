import uuid
from datetime import date, datetime
from decimal import Decimal

from sqlmodel import Field, SQLModel

from app.models.enums import BatchStatus, EnrollmentStatus, PaymentStatus, ProductCode


class Product(SQLModel, table=True):
    __tablename__ = "products"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    code: ProductCode = Field(unique=True)
    name: str = Field(max_length=100)
    description: str | None = None
    price: Decimal
    is_active: bool = Field(default=True)


class Payment(SQLModel, table=True):
    __tablename__ = "payments"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    candidate_id: uuid.UUID = Field(foreign_key="candidates.id", index=True)
    razorpay_order_id: str | None = Field(default=None, max_length=100, index=True)
    razorpay_payment_id: str | None = Field(default=None, max_length=100)
    razorpay_signature: str | None = Field(default=None, max_length=255)
    amount: Decimal
    currency: str = Field(default="INR", max_length=10)
    status: PaymentStatus = Field(default=PaymentStatus.created)
    invoice_number: str | None = Field(default=None, max_length=50, unique=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    paid_at: datetime | None = None


class PaymentItem(SQLModel, table=True):
    """Line items — lets one payment cover a bundle (e.g. Complete Package)."""

    __tablename__ = "payment_items"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    payment_id: uuid.UUID = Field(foreign_key="payments.id", index=True)
    product_id: uuid.UUID = Field(foreign_key="products.id")
    price_at_purchase: Decimal


class Batch(SQLModel, table=True):
    __tablename__ = "batches"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(max_length=100)
    product_id: uuid.UUID = Field(foreign_key="products.id")
    trainer_id: uuid.UUID | None = Field(default=None, foreign_key="users.id")
    capacity: int = Field(default=15)
    start_date: date | None = None
    end_date: date | None = None
    status: BatchStatus = Field(default=BatchStatus.planned)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Enrollment(SQLModel, table=True):
    __tablename__ = "enrollments"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    candidate_id: uuid.UUID = Field(foreign_key="candidates.id", index=True)
    product_id: uuid.UUID = Field(foreign_key="products.id")
    payment_id: uuid.UUID | None = Field(default=None, foreign_key="payments.id")
    batch_id: uuid.UUID | None = Field(default=None, foreign_key="batches.id", index=True)
    support_owner_id: uuid.UUID | None = Field(default=None, foreign_key="users.id")
    status: EnrollmentStatus = Field(default=EnrollmentStatus.active)
    enrolled_at: datetime = Field(default_factory=datetime.utcnow)
