-- CreateEnum
CREATE TYPE "ExpertMockInterviewStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CandidateProjectStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'NEEDS_REVISION', 'APPROVED');

-- CreateEnum
CREATE TYPE "PlacementReadinessDecision" AS ENUM ('PENDING', 'APPROVED', 'NEEDS_WORK');

-- CreateTable
CREATE TABLE "expert_mock_interviews" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "isFinal" BOOLEAN NOT NULL DEFAULT false,
    "status" "ExpertMockInterviewStatus" NOT NULL DEFAULT 'SCHEDULED',
    "score" DOUBLE PRECISION,
    "maxScore" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "reviewerName" TEXT,
    "feedback" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expert_mock_interviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidate_project_reviews" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "projectName" TEXT NOT NULL,
    "status" "CandidateProjectStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "mentorFeedback" TEXT,
    "expertApproved" BOOLEAN NOT NULL DEFAULT false,
    "reviewerName" TEXT,
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "candidate_project_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "placement_readiness_reviews" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "decision" "PlacementReadinessDecision" NOT NULL DEFAULT 'PENDING',
    "approvedByUserId" TEXT,
    "notes" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "placement_readiness_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "expert_mock_interviews_candidateId_status_idx" ON "expert_mock_interviews"("candidateId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "expert_mock_interviews_candidateId_sequence_key" ON "expert_mock_interviews"("candidateId", "sequence");

-- CreateIndex
CREATE INDEX "candidate_project_reviews_candidateId_status_idx" ON "candidate_project_reviews"("candidateId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "placement_readiness_reviews_candidateId_key" ON "placement_readiness_reviews"("candidateId");

-- CreateIndex
CREATE INDEX "placement_readiness_reviews_decision_updatedAt_idx" ON "placement_readiness_reviews"("decision", "updatedAt");

-- AddForeignKey
ALTER TABLE "expert_mock_interviews" ADD CONSTRAINT "expert_mock_interviews_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_project_reviews" ADD CONSTRAINT "candidate_project_reviews_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placement_readiness_reviews" ADD CONSTRAINT "placement_readiness_reviews_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
