-- CreateEnum
CREATE TYPE "PlacementApplicationStatus" AS ENUM ('DRAFT', 'APPLIED', 'SHORTLISTED', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "PlacementInterviewStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED');

-- CreateEnum
CREATE TYPE "PlacementInterviewOutcome" AS ENUM ('PENDING', 'PASSED', 'FAILED', 'ON_HOLD');

-- CreateEnum
CREATE TYPE "PlacementOfferStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'WITHDRAWN');

-- CreateTable
CREATE TABLE "placement_applications" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "jobLocation" TEXT,
    "employmentType" TEXT,
    "jobDescription" TEXT,
    "source" TEXT,
    "status" "PlacementApplicationStatus" NOT NULL DEFAULT 'DRAFT',
    "appliedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "placement_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "placement_interviews" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "round" INTEGER NOT NULL DEFAULT 1,
    "title" TEXT,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "durationMins" INTEGER,
    "mode" TEXT,
    "meetingLink" TEXT,
    "interviewer" TEXT,
    "status" "PlacementInterviewStatus" NOT NULL DEFAULT 'SCHEDULED',
    "outcome" "PlacementInterviewOutcome" NOT NULL DEFAULT 'PENDING',
    "feedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "placement_interviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "placement_offers" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "status" "PlacementOfferStatus" NOT NULL DEFAULT 'PENDING',
    "compensation" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "offeredAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "joiningDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "placement_offers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "placement_applications_candidateId_status_idx" ON "placement_applications"("candidateId", "status");

-- CreateIndex
CREATE INDEX "placement_applications_status_updatedAt_idx" ON "placement_applications"("status", "updatedAt");

-- CreateIndex
CREATE INDEX "placement_applications_companyName_idx" ON "placement_applications"("companyName");

-- CreateIndex
CREATE INDEX "placement_interviews_applicationId_scheduledAt_idx" ON "placement_interviews"("applicationId", "scheduledAt");

-- CreateIndex
CREATE INDEX "placement_interviews_scheduledAt_status_idx" ON "placement_interviews"("scheduledAt", "status");

-- CreateIndex
CREATE UNIQUE INDEX "placement_offers_applicationId_key" ON "placement_offers"("applicationId");

-- CreateIndex
CREATE INDEX "placement_offers_status_joiningDate_idx" ON "placement_offers"("status", "joiningDate");

-- AddForeignKey
ALTER TABLE "placement_applications" ADD CONSTRAINT "placement_applications_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placement_applications" ADD CONSTRAINT "placement_applications_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placement_interviews" ADD CONSTRAINT "placement_interviews_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "placement_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placement_offers" ADD CONSTRAINT "placement_offers_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "placement_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
