-- CreateEnum
CREATE TYPE "CheckpointAttemptStatus" AS ENUM ('IN_PROGRESS', 'PASSED', 'FAILED');

-- CreateTable
CREATE TABLE "checkpoints" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "fromModuleOrder" INTEGER NOT NULL,
    "toModuleOrder" INTEGER NOT NULL,
    "passMarkPercent" INTEGER NOT NULL DEFAULT 80,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "checkpoints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checkpoint_questions" (
    "id" TEXT NOT NULL,
    "checkpointId" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "options" TEXT[],
    "correctIndex" INTEGER NOT NULL,
    "explanation" TEXT,
    "lessonId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "checkpoint_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checkpoint_attempts" (
    "id" TEXT NOT NULL,
    "checkpointId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL,
    "status" "CheckpointAttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "correctCount" INTEGER,
    "totalQuestions" INTEGER NOT NULL,
    "scorePercent" INTEGER,
    "responses" JSONB,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "checkpoint_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "checkpoints_courseId_idx" ON "checkpoints"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "checkpoints_courseId_sortOrder_key" ON "checkpoints"("courseId", "sortOrder");

-- CreateIndex
CREATE INDEX "checkpoint_questions_checkpointId_idx" ON "checkpoint_questions"("checkpointId");

-- CreateIndex
CREATE UNIQUE INDEX "checkpoint_questions_checkpointId_sortOrder_key" ON "checkpoint_questions"("checkpointId", "sortOrder");

-- CreateIndex
CREATE INDEX "checkpoint_attempts_userId_checkpointId_idx" ON "checkpoint_attempts"("userId", "checkpointId");

-- CreateIndex
CREATE INDEX "checkpoint_attempts_status_idx" ON "checkpoint_attempts"("status");

-- CreateIndex
CREATE UNIQUE INDEX "checkpoint_attempts_checkpointId_userId_attemptNumber_key" ON "checkpoint_attempts"("checkpointId", "userId", "attemptNumber");

-- AddForeignKey
ALTER TABLE "checkpoints" ADD CONSTRAINT "checkpoints_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkpoint_questions" ADD CONSTRAINT "checkpoint_questions_checkpointId_fkey" FOREIGN KEY ("checkpointId") REFERENCES "checkpoints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkpoint_attempts" ADD CONSTRAINT "checkpoint_attempts_checkpointId_fkey" FOREIGN KEY ("checkpointId") REFERENCES "checkpoints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkpoint_attempts" ADD CONSTRAINT "checkpoint_attempts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
