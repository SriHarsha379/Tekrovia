-- CreateEnum
CREATE TYPE "PlacementPipelineStage" AS ENUM ('PROFILE_REVIEW', 'PREPARATION_PENDING', 'JOB_READY', 'RESUME_APPROVED', 'JOBS_MATCHED', 'SUBMITTED', 'INTERVIEW_SCHEDULED', 'FEEDBACK_AWAITED', 'SELECTED', 'OFFER_RECEIVED', 'JOINED');

-- AlterTable
ALTER TABLE "placement_applications" ADD COLUMN     "pipelineStage" "PlacementPipelineStage" NOT NULL DEFAULT 'PROFILE_REVIEW';

-- CreateTable
CREATE TABLE "placement_pipeline_history" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "fromStage" "PlacementPipelineStage",
    "toStage" "PlacementPipelineStage" NOT NULL,
    "note" TEXT,
    "changedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "placement_pipeline_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "placement_pipeline_history_applicationId_createdAt_idx" ON "placement_pipeline_history"("applicationId", "createdAt");

-- CreateIndex
CREATE INDEX "placement_pipeline_history_toStage_createdAt_idx" ON "placement_pipeline_history"("toStage", "createdAt");

-- AddForeignKey
ALTER TABLE "placement_pipeline_history" ADD CONSTRAINT "placement_pipeline_history_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "placement_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
