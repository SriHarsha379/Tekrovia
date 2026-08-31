"""
Every fixed-vocabulary status/category field in the schema is an enum here.
These mirror the Postgres ENUM types 1:1 (see db/schema.sql) so invalid
states are rejected by Pydantic before they ever reach the database.
"""

from enum import Enum


class StaffRole(str, Enum):
    admin = "admin"
    marketing = "marketing"
    trainer = "trainer"
    mentor = "mentor"
    support = "support"
    placement = "placement"


class ChannelType(str, Enum):
    meta = "meta"
    google = "google"
    youtube = "youtube"
    linkedin = "linkedin"
    organic = "organic"
    referral = "referral"
    other = "other"


class LeadStatus(str, Enum):
    new = "new"
    contacted = "contacted"
    converted = "converted"
    dropped = "dropped"


class CandidateClassification(str, Enum):
    beginner = "beginner"
    starter = "starter"
    pro = "pro"


class ProductCode(str, Enum):
    tech_training = "tech_training"
    interview_prep = "interview_prep"
    placement_support = "placement_support"
    soft_skills = "soft_skills"
    complete_package = "complete_package"


class PaymentStatus(str, Enum):
    created = "created"
    authorized = "authorized"
    paid = "paid"
    failed = "failed"
    refunded = "refunded"


class EnrollmentStatus(str, Enum):
    active = "active"
    paused = "paused"
    completed = "completed"
    dropped = "dropped"


class BatchStatus(str, Enum):
    planned = "planned"
    active = "active"
    completed = "completed"
    cancelled = "cancelled"


class TrialSessionStatus(str, Enum):
    scheduled = "scheduled"
    completed = "completed"
    missed = "missed"


class AutomationTrigger(str, Enum):
    registration = "registration"
    after_session_1 = "after_session_1"
    after_session_2 = "after_session_2"
    after_session_3 = "after_session_3"
    plus_24h = "plus_24h"
    plus_72h = "plus_72h"
    plus_7d = "plus_7d"


class AutomationChannel(str, Enum):
    whatsapp = "whatsapp"
    email = "email"
    sms = "sms"


class LessonType(str, Enum):
    video = "video"
    trainer_explanation = "trainer_explanation"
    lab = "lab"
    notes = "notes"
    assignment = "assignment"
    quiz = "quiz"
    practical = "practical"
    interview_questions = "interview_questions"
    ai_doubt_assistant = "ai_doubt_assistant"


class ActivityStatus(str, Enum):
    not_started = "not_started"
    in_progress = "in_progress"
    completed = "completed"


class SubmissionStatus(str, Enum):
    submitted = "submitted"
    ai_reviewed = "ai_reviewed"
    mentor_approved = "mentor_approved"
    rejected = "rejected"


class AssessmentType(str, Enum):
    free_assessment = "free_assessment"
    ai_mock_diagnostic = "ai_mock_diagnostic"
    module_quiz = "module_quiz"
    formal_readiness = "formal_readiness"


class ReadinessClassification(str, Enum):
    job_ready = "job_ready"
    targeted_brushup = "targeted_brushup"
    structured_preparation = "structured_preparation"


class MockType(str, Enum):
    ai_practice = "ai_practice"
    expert_mock = "expert_mock"


class GateStatus(str, Enum):
    pending = "pending"
    qualified = "qualified"
    approved_for_placement = "approved_for_placement"


class TicketCategory(str, Enum):
    lms = "lms"
    payment = "payment"
    schedule = "schedule"
    trainer = "trainer"
    assignment = "assignment"
    project = "project"
    interview = "interview"
    resume = "resume"
    mock = "mock"
    placement = "placement"
    technical = "technical"


class TicketStatus(str, Enum):
    open = "open"
    in_progress = "in_progress"
    resolved = "resolved"
    escalated = "escalated"


class SubmissionChannel(str, Enum):
    portal = "portal"
    hr = "hr"
    direct_vendor = "direct_vendor"
    client = "client"


class PipelineStage(str, Enum):
    profile_review = "profile_review"
    preparation_pending = "preparation_pending"
    job_ready = "job_ready"
    resume_approved = "resume_approved"
    jobs_matched = "jobs_matched"
    submitted = "submitted"
    interview_scheduled = "interview_scheduled"
    feedback_awaited = "feedback_awaited"
    selected = "selected"
    offer_received = "offer_received"
    joined = "joined"


class RecoveryStatus(str, Enum):
    active = "active"
    paused_for_brushup = "paused_for_brushup"
    resumed = "resumed"
    closed = "closed"
