import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import Column
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, SQLModel

from app.models.enums import ActivityStatus, LessonType, SubmissionStatus


class Course(SQLModel, table=True):
    __tablename__ = "courses"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    product_id: uuid.UUID = Field(foreign_key="products.id")
    title: str = Field(max_length=150)
    description: str | None = None


class Module(SQLModel, table=True):
    __tablename__ = "modules"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    course_id: uuid.UUID = Field(foreign_key="courses.id", index=True)
    title: str = Field(max_length=150)
    order_index: int
    # e.g. {"requires_module_id": "...", "min_score": 70}
    unlock_rule: dict | None = Field(default=None, sa_column=Column(JSONB))


class Lesson(SQLModel, table=True):
    __tablename__ = "lessons"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    module_id: uuid.UUID = Field(foreign_key="modules.id", index=True)
    title: str = Field(max_length=150)
    type: LessonType
    order_index: int
    video_asset_id: str | None = Field(default=None, max_length=150)  # Mux/Cloudflare Stream id
    content: str | None = None


class Activity(SQLModel, table=True):
    """Per-candidate progress on a lesson."""

    __tablename__ = "activities"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    candidate_id: uuid.UUID = Field(foreign_key="candidates.id", index=True)
    lesson_id: uuid.UUID = Field(foreign_key="lessons.id")
    status: ActivityStatus = Field(default=ActivityStatus.not_started)
    score: Decimal | None = None
    completed_at: datetime | None = None


class Assignment(SQLModel, table=True):
    __tablename__ = "assignments"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    lesson_id: uuid.UUID | None = Field(default=None, foreign_key="lessons.id")
    title: str = Field(max_length=150)
    instructions: str | None = None
    due_offset_days: int | None = None


class AssignmentSubmission(SQLModel, table=True):
    __tablename__ = "assignment_submissions"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    assignment_id: uuid.UUID = Field(foreign_key="assignments.id")
    candidate_id: uuid.UUID = Field(foreign_key="candidates.id", index=True)
    submission_url: str | None = None
    status: SubmissionStatus = Field(default=SubmissionStatus.submitted)
    score: Decimal | None = None
    submitted_at: datetime = Field(default_factory=datetime.utcnow)
    reviewed_at: datetime | None = None


class Project(SQLModel, table=True):
    __tablename__ = "projects"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    course_id: uuid.UUID = Field(foreign_key="courses.id")
    title: str = Field(max_length=150)
    business_problem: str | None = None
    expected_outcome: str | None = None
    milestones: dict | None = Field(default=None, sa_column=Column(JSONB))


class ProjectSubmission(SQLModel, table=True):
    __tablename__ = "project_submissions"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    project_id: uuid.UUID = Field(foreign_key="projects.id")
    candidate_id: uuid.UUID = Field(foreign_key="candidates.id", index=True)
    submission_url: str | None = None
    ai_review_feedback: str | None = None
    ai_review_score: Decimal | None = None
    mentor_id: uuid.UUID | None = Field(default=None, foreign_key="users.id")
    mentor_feedback: str | None = None
    status: SubmissionStatus = Field(default=SubmissionStatus.submitted)
    final_presentation_at: datetime | None = None
    submitted_at: datetime = Field(default_factory=datetime.utcnow)
    reviewed_at: datetime | None = None
