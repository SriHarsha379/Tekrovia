-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('STUDENT', 'TRAINER', 'COUNSELLOR', 'SUPPORT_STAFF', 'PLACEMENT_MANAGER', 'RECRUITER', 'ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "CandidateClassification" AS ENUM ('BEGINNER', 'STARTER', 'PRO');

-- CreateEnum
CREATE TYPE "AssessmentType" AS ENUM ('FREE_ASSESSMENT', 'CAREER_READINESS', 'TECHNICAL', 'MOCK_INTERVIEW');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'INTERESTED', 'PROSPECT', 'PIPELINE', 'PENDING_CLOSURE', 'ENROLLED', 'DROPPED');

-- CreateEnum
CREATE TYPE "AssessmentStatus" AS ENUM ('DRAFT', 'IN_PROGRESS', 'COMPLETED', 'REVIEWED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'STUDENT',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "deviceInfo" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otp_codes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "purpose" TEXT NOT NULL DEFAULT 'login',
    "code" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidates" (
    "id" TEXT NOT NULL,
    "candidateCode" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "education" TEXT,
    "graduationYear" INTEGER,
    "experienceYears" INTEGER NOT NULL DEFAULT 0,
    "currentEmployment" TEXT,
    "skills" TEXT[],
    "previousTraining" TEXT,
    "careerGapMonths" INTEGER NOT NULL DEFAULT 0,
    "targetRole" TEXT,
    "codingPreference" TEXT,
    "resumeUrl" TEXT,
    "learningAvailability" TEXT,
    "preferredSchedule" TEXT,
    "courseInterest" TEXT,
    "campaignSource" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "utmContent" TEXT,
    "utmTerm" TEXT,
    "consentGiven" BOOLEAN NOT NULL DEFAULT false,
    "communicationPrefs" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "classification" "CandidateClassification",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "candidates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registrations" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "education" TEXT,
    "graduationYear" INTEGER,
    "experienceYears" INTEGER,
    "currentEmployment" TEXT,
    "skills" TEXT[],
    "targetRole" TEXT,
    "codingPreference" TEXT,
    "resumeUrl" TEXT,
    "learningAvailability" TEXT,
    "preferredSchedule" TEXT,
    "courseInterest" TEXT,
    "campaignSource" TEXT,
    "consentGiven" BOOLEAN NOT NULL DEFAULT false,
    "communicationPrefs" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessments" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "createdByUserId" TEXT,
    "type" "AssessmentType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "score" DOUBLE PRECISION,
    "maxScore" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "classification" TEXT,
    "status" "AssessmentStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "responses" JSONB,
    "roadmap" JSONB,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "leadCode" TEXT NOT NULL,
    "candidateId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "courseInterest" TEXT,
    "source" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "utmContent" TEXT,
    "utmTerm" TEXT,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "ownerId" TEXT,
    "notes" TEXT,
    "consentGiven" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "candidateId" TEXT,
    "action" TEXT NOT NULL,
    "details" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "health_checks" (
    "id" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "health_checks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_accessToken_key" ON "sessions"("accessToken");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_refreshToken_key" ON "sessions"("refreshToken");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE INDEX "otp_codes_userId_idx" ON "otp_codes"("userId");

-- CreateIndex
CREATE INDEX "otp_codes_purpose_idx" ON "otp_codes"("purpose");

-- CreateIndex
CREATE UNIQUE INDEX "candidates_candidateCode_key" ON "candidates"("candidateCode");

-- CreateIndex
CREATE UNIQUE INDEX "candidates_userId_key" ON "candidates"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "candidates_email_key" ON "candidates"("email");

-- CreateIndex
CREATE UNIQUE INDEX "candidates_phone_key" ON "candidates"("phone");

-- CreateIndex
CREATE INDEX "candidates_candidateCode_idx" ON "candidates"("candidateCode");

-- CreateIndex
CREATE INDEX "candidates_email_idx" ON "candidates"("email");

-- CreateIndex
CREATE INDEX "candidates_phone_idx" ON "candidates"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "registrations_candidateId_key" ON "registrations"("candidateId");

-- CreateIndex
CREATE INDEX "assessments_candidateId_idx" ON "assessments"("candidateId");

-- CreateIndex
CREATE INDEX "assessments_type_idx" ON "assessments"("type");

-- CreateIndex
CREATE UNIQUE INDEX "leads_leadCode_key" ON "leads"("leadCode");

-- CreateIndex
CREATE INDEX "leads_email_idx" ON "leads"("email");

-- CreateIndex
CREATE INDEX "leads_phone_idx" ON "leads"("phone");

-- CreateIndex
CREATE INDEX "leads_status_idx" ON "leads"("status");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_candidateId_idx" ON "audit_logs"("candidateId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "otp_codes" ADD CONSTRAINT "otp_codes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "candidates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "candidates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
