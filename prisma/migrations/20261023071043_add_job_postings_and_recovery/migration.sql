-- CreateEnum
CREATE TYPE "JobPostingStatus" AS ENUM ('OPEN', 'ON_HOLD', 'FILLED', 'CLOSED');

-- CreateEnum
CREATE TYPE "RecoveryStatus" AS ENUM ('ACTIVE', 'IN_REVIEW', 'BRUSH_UP', 'REASSESSED', 'CLEARED');

-- AlterTable
ALTER TABLE "placement_applications" ADD COLUMN     "jobPostingId" TEXT;

-- CreateTable
CREATE TABLE "job_postings" (
    "id" TEXT NOT NULL,
    "postingCode" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "location" TEXT,
    "employmentType" TEXT,
    "description" TEXT,
    "requirements" TEXT[],
    "minExperience" INTEGER,
    "salaryMin" DOUBLE PRECISION,
    "salaryMax" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "jobUrl" TEXT,
    "source" TEXT,
    "status" "JobPostingStatus" NOT NULL DEFAULT 'OPEN',
    "openings" INTEGER NOT NULL DEFAULT 1,
    "closingDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_postings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "placement_recoveries" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "triggeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "failedInterviews" INTEGER NOT NULL,
    "status" "RecoveryStatus" NOT NULL DEFAULT 'ACTIVE',
    "rejectionReasons" TEXT[],
    "skillGaps" TEXT[],
    "plan" TEXT,
    "reviewedByUserId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "clearedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "placement_recoveries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "job_postings_postingCode_key" ON "job_postings"("postingCode");

-- CreateIndex
CREATE INDEX "job_postings_status_createdAt_idx" ON "job_postings"("status", "createdAt");

-- CreateIndex
CREATE INDEX "job_postings_companyName_idx" ON "job_postings"("companyName");

-- CreateIndex
CREATE INDEX "placement_recoveries_candidateId_status_idx" ON "placement_recoveries"("candidateId", "status");

-- CreateIndex
CREATE INDEX "placement_recoveries_status_triggeredAt_idx" ON "placement_recoveries"("status", "triggeredAt");

-- AddForeignKey
ALTER TABLE "placement_applications" ADD CONSTRAINT "placement_applications_jobPostingId_fkey" FOREIGN KEY ("jobPostingId") REFERENCES "job_postings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placement_recoveries" ADD CONSTRAINT "placement_recoveries_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
