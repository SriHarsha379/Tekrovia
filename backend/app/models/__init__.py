# Import all models here so SQLModel/Alembic can discover every table
# when app.models is imported once at startup.

from app.models.staff import User, OTPVerification  # noqa: F401
from app.models.marketing import Campaign, Lead, FunnelEvent  # noqa: F401
from app.models.candidate import Candidate, Registration  # noqa: F401
from app.models.commerce import (  # noqa: F401
    Product,
    Payment,
    PaymentItem,
    Batch,
    Enrollment,
)
from app.models.trial import TrialProgress, AutomationEvent  # noqa: F401
from app.models.lms import (  # noqa: F401
    Course,
    Module,
    Lesson,
    Activity,
    Assignment,
    AssignmentSubmission,
    Project,
    ProjectSubmission,
)
from app.models.assessment import (  # noqa: F401
    Assessment,
    MockInterview,
    Resume,
    ReadinessGate,
)
from app.models.support import SupportTicket, TicketComment  # noqa: F401
from app.models.placement import (  # noqa: F401
    JobPosting,
    JobMatch,
    PlacementSubmission,
    InterviewRound,
    PlacementRecovery,
)
