-- ============================================================================
-- TekRovia — PostgreSQL Schema
-- Learning-to-Placement Platform (SkillMove)
-- Stack: FastAPI + SQLAlchemy/SQLModel + Alembic (migrations) + Next.js
-- Data foundation per blueprint: Campaign → Lead → Candidate → Registration →
-- Payment → Batch → Activity → Assessment → Support → Placement
-- ============================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

CREATE TYPE staff_role AS ENUM (
    'admin', 'marketing', 'trainer', 'mentor', 'support', 'placement'
);

CREATE TYPE channel_type AS ENUM ('meta', 'google', 'youtube', 'linkedin', 'organic', 'referral', 'other');

CREATE TYPE lead_status AS ENUM ('new', 'contacted', 'converted', 'dropped');

CREATE TYPE candidate_classification AS ENUM ('beginner', 'starter', 'pro');

CREATE TYPE product_code AS ENUM (
    'tech_training', 'interview_prep', 'placement_support', 'soft_skills', 'complete_package'
);

CREATE TYPE payment_status AS ENUM ('created', 'authorized', 'paid', 'failed', 'refunded');

CREATE TYPE enrollment_status AS ENUM ('active', 'paused', 'completed', 'dropped');

CREATE TYPE batch_status AS ENUM ('planned', 'active', 'completed', 'cancelled');

CREATE TYPE trial_session_status AS ENUM ('scheduled', 'completed', 'missed');

CREATE TYPE automation_trigger AS ENUM (
    'registration', 'after_session_1', 'after_session_2', 'after_session_3',
    'plus_24h', 'plus_72h', 'plus_7d'
);

CREATE TYPE automation_channel AS ENUM ('whatsapp', 'email', 'sms');

CREATE TYPE lesson_type AS ENUM (
    'video', 'trainer_explanation', 'lab', 'notes', 'assignment', 'quiz',
    'practical', 'interview_questions', 'ai_doubt_assistant'
);

CREATE TYPE activity_status AS ENUM ('not_started', 'in_progress', 'completed');

CREATE TYPE submission_status AS ENUM ('submitted', 'ai_reviewed', 'mentor_approved', 'rejected');

CREATE TYPE assessment_type AS ENUM (
    'free_assessment', 'ai_mock_diagnostic', 'module_quiz', 'formal_readiness'
);

CREATE TYPE readiness_classification AS ENUM ('job_ready', 'targeted_brushup', 'structured_preparation');

CREATE TYPE mock_type AS ENUM ('ai_practice', 'expert_mock');

CREATE TYPE gate_status AS ENUM ('pending', 'qualified', 'approved_for_placement');

CREATE TYPE ticket_category AS ENUM (
    'lms', 'payment', 'schedule', 'trainer', 'assignment', 'project',
    'interview', 'resume', 'mock', 'placement', 'technical'
);

CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'escalated');

CREATE TYPE submission_channel AS ENUM ('portal', 'hr', 'direct_vendor', 'client');

CREATE TYPE pipeline_stage AS ENUM (
    'profile_review', 'preparation_pending', 'job_ready', 'resume_approved',
    'jobs_matched', 'submitted', 'interview_scheduled', 'feedback_awaited',
    'selected', 'offer_received', 'joined'
);

CREATE TYPE recovery_status AS ENUM ('active', 'paused_for_brushup', 'resumed', 'closed');

-- ============================================================================
-- INTERNAL STAFF / AUTH
-- ============================================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(20),
    role staff_role NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- OTP verification for candidate login (email/phone OTP -> JWT session issued by API)
CREATE TABLE otp_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier VARCHAR(150) NOT NULL,          -- phone or email
    otp_code_hash VARCHAR(255) NOT NULL,
    purpose VARCHAR(30) NOT NULL DEFAULT 'login',
    expires_at TIMESTAMPTZ NOT NULL,
    verified_at TIMESTAMPTZ,
    attempt_count SMALLINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_otp_identifier ON otp_verifications(identifier);

-- ============================================================================
-- MARKETING FUNNEL: CAMPAIGN -> LEAD -> CANDIDATE
-- ============================================================================

CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    channel channel_type NOT NULL,
    target_audience VARCHAR(255),
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    utm_content VARCHAR(100),
    utm_term VARCHAR(100),
    budget NUMERIC(12,2),
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
    name VARCHAR(150),
    phone VARCHAR(20),
    email VARCHAR(150),
    landing_page_url TEXT,
    status lead_status NOT NULL DEFAULT 'new',
    metadata JSONB,                             -- raw UTM / device / referrer capture
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_leads_campaign ON leads(campaign_id);
CREATE INDEX idx_leads_phone_email ON leads(phone, email);

CREATE TABLE candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_code VARCHAR(20) UNIQUE NOT NULL,  -- e.g. TKR-2026-000123, generated by auth service
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE,
    phone VARCHAR(20) UNIQUE,
    classification candidate_classification,     -- set post-onboarding assessment
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_candidates_code ON candidates(candidate_code);

ALTER TABLE leads ADD COLUMN converted_candidate_id UUID REFERENCES candidates(id) ON DELETE SET NULL;

CREATE TABLE registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    education VARCHAR(150),
    graduation_year SMALLINT,
    experience_years NUMERIC(4,1),
    current_skills TEXT[],
    earlier_training TEXT,
    career_gap_months SMALLINT,
    target_role VARCHAR(150),
    coding_preference VARCHAR(100),
    resume_url TEXT,
    learning_availability VARCHAR(100),
    chosen_schedule VARCHAR(100),
    campaign_source_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_registrations_candidate ON registrations(candidate_id);

-- ============================================================================
-- FUNNEL EVENT TRACKING (for the daily dashboard funnel: visitor -> enrollment)
-- ============================================================================

CREATE TABLE funnel_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    candidate_id UUID REFERENCES candidates(id) ON DELETE SET NULL,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL,             -- visit, registration, assessment_start,
                                                  -- assessment_complete, checkout_start, enrollment
    metadata JSONB,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_funnel_events_type_time ON funnel_events(event_type, occurred_at);

-- ============================================================================
-- PRODUCTS, PAYMENTS, ENROLLMENT
-- ============================================================================

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code product_code UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price NUMERIC(10,2) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    razorpay_order_id VARCHAR(100),
    razorpay_payment_id VARCHAR(100),
    razorpay_signature VARCHAR(255),
    amount NUMERIC(10,2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    status payment_status NOT NULL DEFAULT 'created',
    invoice_number VARCHAR(50) UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    paid_at TIMESTAMPTZ
);
CREATE INDEX idx_payments_candidate ON payments(candidate_id);
CREATE INDEX idx_payments_razorpay_order ON payments(razorpay_order_id);

-- Line items so one payment can cover a bundle (Complete Package = multiple products)
CREATE TABLE payment_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    price_at_purchase NUMERIC(10,2) NOT NULL
);

CREATE TABLE batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    product_id UUID NOT NULL REFERENCES products(id),
    trainer_id UUID REFERENCES users(id),
    capacity SMALLINT NOT NULL DEFAULT 15,
    start_date DATE,
    end_date DATE,
    status batch_status NOT NULL DEFAULT 'planned',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    payment_id UUID REFERENCES payments(id),
    batch_id UUID REFERENCES batches(id) ON DELETE SET NULL,
    support_owner_id UUID REFERENCES users(id),   -- assigned automatically on onboarding
    status enrollment_status NOT NULL DEFAULT 'active',
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (candidate_id, product_id)
);
CREATE INDEX idx_enrollments_candidate ON enrollments(candidate_id);
CREATE INDEX idx_enrollments_batch ON enrollments(batch_id);

-- ============================================================================
-- TRIAL FLOW (pre-purchase, 3-session GenAI trial) + AUTOMATION LOG
-- ============================================================================

CREATE TABLE trial_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    session_number SMALLINT NOT NULL CHECK (session_number BETWEEN 1 AND 3),
    status trial_session_status NOT NULL DEFAULT 'scheduled',
    lab_completed BOOLEAN NOT NULL DEFAULT FALSE,
    scheduled_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    UNIQUE (candidate_id, session_number)
);

CREATE TABLE automation_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    trigger_type automation_trigger NOT NULL,
    channel automation_channel NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'sent',   -- sent, failed, skipped
    payload JSONB,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_automation_candidate ON automation_events(candidate_id);

-- ============================================================================
-- LMS: COURSES -> MODULES -> LESSONS -> ACTIVITY
-- ============================================================================

CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id),
    title VARCHAR(150) NOT NULL,
    description TEXT
);

CREATE TABLE modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    order_index SMALLINT NOT NULL,
    unlock_rule JSONB                              -- e.g. {"requires_module_id": "...", "min_score": 70}
);
CREATE INDEX idx_modules_course ON modules(course_id);

CREATE TABLE lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    type lesson_type NOT NULL,
    order_index SMALLINT NOT NULL,
    video_asset_id VARCHAR(150),                   -- Mux/Cloudflare Stream asset id
    content TEXT
);
CREATE INDEX idx_lessons_module ON lessons(module_id);

CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    status activity_status NOT NULL DEFAULT 'not_started',
    score NUMERIC(5,2),
    completed_at TIMESTAMPTZ,
    UNIQUE (candidate_id, lesson_id)
);
CREATE INDEX idx_activities_candidate ON activities(candidate_id);

CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    instructions TEXT,
    due_offset_days SMALLINT
);

CREATE TABLE assignment_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    submission_url TEXT,
    status submission_status NOT NULL DEFAULT 'submitted',
    score NUMERIC(5,2),
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    reviewed_at TIMESTAMPTZ
);
CREATE INDEX idx_asg_submissions_candidate ON assignment_submissions(candidate_id);

-- ============================================================================
-- PROJECTS (two guided projects per Technology Training)
-- ============================================================================

CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    business_problem TEXT,
    expected_outcome TEXT,
    milestones JSONB
);

CREATE TABLE project_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    submission_url TEXT,
    ai_review_feedback TEXT,
    ai_review_score NUMERIC(5,2),
    mentor_id UUID REFERENCES users(id),
    mentor_feedback TEXT,
    status submission_status NOT NULL DEFAULT 'submitted',
    final_presentation_at TIMESTAMPTZ,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    reviewed_at TIMESTAMPTZ
);
CREATE INDEX idx_project_submissions_candidate ON project_submissions(candidate_id);

-- ============================================================================
-- ASSESSMENTS (free assessment, module quiz, AI mock diagnostic, formal readiness)
-- ============================================================================

CREATE TABLE assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    type assessment_type NOT NULL,
    related_module_id UUID REFERENCES modules(id) ON DELETE SET NULL,
    score NUMERIC(5,2),
    max_score NUMERIC(5,2),
    breakdown JSONB,                                -- {"theory": 4, "logical": 5, "practical": 3}
    classification readiness_classification,         -- only for formal_readiness type
    taken_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_assessments_candidate ON assessments(candidate_id);

-- ============================================================================
-- INTERVIEW READINESS: MOCKS, RESUME, GATE
-- ============================================================================

CREATE TABLE mock_interviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    type mock_type NOT NULL,
    mock_number SMALLINT,                           -- 1,2,3 for expert mocks; null for AI practice
    interviewer_id UUID REFERENCES users(id),        -- set only for expert_mock
    is_final_mock BOOLEAN NOT NULL DEFAULT FALSE,
    score NUMERIC(5,2),
    feedback TEXT,
    conducted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_mocks_candidate ON mock_interviews(candidate_id);

CREATE TABLE resumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    version SMALLINT NOT NULL DEFAULT 1,
    ats_score NUMERIC(5,2),
    reviewed_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Readiness gate: projects complete + 3 mocks complete + score >=8/10 + final mock >=8/10
CREATE TABLE readiness_gates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    projects_complete BOOLEAN NOT NULL DEFAULT FALSE,
    mocks_complete BOOLEAN NOT NULL DEFAULT FALSE,
    formal_score NUMERIC(4,2),
    final_mock_score NUMERIC(4,2),
    status gate_status NOT NULL DEFAULT 'pending',
    evaluated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_readiness_candidate ON readiness_gates(candidate_id);

-- ============================================================================
-- SUPPORT / TICKETING
-- ============================================================================

CREATE TABLE support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    category ticket_category NOT NULL,
    subject VARCHAR(200) NOT NULL,
    description TEXT,
    status ticket_status NOT NULL DEFAULT 'open',
    assigned_to UUID REFERENCES users(id),
    sla_due_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at TIMESTAMPTZ
);
CREATE INDEX idx_tickets_candidate ON support_tickets(candidate_id);
CREATE INDEX idx_tickets_status ON support_tickets(status);

CREATE TABLE ticket_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    author_user_id UUID REFERENCES users(id),
    author_candidate_id UUID REFERENCES candidates(id),
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (
        (author_user_id IS NOT NULL AND author_candidate_id IS NULL) OR
        (author_user_id IS NULL AND author_candidate_id IS NOT NULL)
    )
);

-- ============================================================================
-- PLACEMENT OPERATIONS
-- ============================================================================

CREATE TABLE job_postings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_name VARCHAR(150) NOT NULL,
    role_title VARCHAR(150) NOT NULL,
    job_description TEXT,
    job_link TEXT,
    location VARCHAR(100),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE job_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    job_posting_id UUID NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
    match_evidence JSONB,                            -- which resume/project/skill lines matched the JD
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (candidate_id, job_posting_id)
);

CREATE TABLE placement_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    job_posting_id UUID REFERENCES job_postings(id) ON DELETE SET NULL,
    stage pipeline_stage NOT NULL DEFAULT 'profile_review',
    channel submission_channel,
    blocker TEXT,
    next_action TEXT,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_placement_candidate ON placement_submissions(candidate_id);
CREATE INDEX idx_placement_stage ON placement_submissions(stage);

CREATE TABLE interview_rounds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES placement_submissions(id) ON DELETE CASCADE,
    round_number SMALLINT NOT NULL,
    scheduled_at TIMESTAMPTZ,
    outcome VARCHAR(50),                             -- pending, cleared, rejected
    feedback TEXT
);

-- Four-interview recovery rule
CREATE TABLE placement_recovery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    rejection_count SMALLINT NOT NULL DEFAULT 0,
    paused_at TIMESTAMPTZ,
    brushup_start DATE,
    brushup_end DATE,
    repeat_mock_id UUID REFERENCES mock_interviews(id),
    resumed_at TIMESTAMPTZ,
    status recovery_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_recovery_candidate ON placement_recovery(candidate_id);

-- ============================================================================
-- SEED DATA — the 5 fixed products from the blueprint
-- ============================================================================

INSERT INTO products (code, name, description, price) VALUES
    ('tech_training',     'Technology Training',    'All modules, guided labs, assignments and two guided projects', 9999),
    ('interview_prep',    'Interview Preparation',  'Interview curriculum, AI practice, three expert mocks and resume prep', 9999),
    ('placement_support', 'Placement Support',      'Job matching, verified submissions, interview coordination and feedback tracking', 9999),
    ('soft_skills',       'Corporate Soft Skills',  'Communication, HR rounds, workplace skills, email and presentation', 5000),
    ('complete_package',  'Complete Package',       'All services; suggested introductory bundle', 29999);
