-- CreateEnum
CREATE TYPE "LiveClassStatus" AS ENUM ('SCHEDULED', 'LIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'LATE', 'ABSENT', 'EXCUSED');

-- CreateTable
CREATE TABLE "live_classes" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "durationMins" INTEGER NOT NULL DEFAULT 60,
    "meetingLink" TEXT,
    "recordingUrl" TEXT,
    "status" "LiveClassStatus" NOT NULL DEFAULT 'SCHEDULED',
    "trainerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "live_classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "class_attendance" (
    "id" TEXT NOT NULL,
    "liveClassId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'ABSENT',
    "note" TEXT,
    "markedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "class_attendance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "live_classes_batchId_scheduledAt_idx" ON "live_classes"("batchId", "scheduledAt");

-- CreateIndex
CREATE INDEX "live_classes_scheduledAt_status_idx" ON "live_classes"("scheduledAt", "status");

-- CreateIndex
CREATE INDEX "class_attendance_userId_status_idx" ON "class_attendance"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "class_attendance_liveClassId_userId_key" ON "class_attendance"("liveClassId", "userId");

-- AddForeignKey
ALTER TABLE "live_classes" ADD CONSTRAINT "live_classes_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_classes" ADD CONSTRAINT "live_classes_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_attendance" ADD CONSTRAINT "class_attendance_liveClassId_fkey" FOREIGN KEY ("liveClassId") REFERENCES "live_classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_attendance" ADD CONSTRAINT "class_attendance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
