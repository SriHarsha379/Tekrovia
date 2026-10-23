-- CreateEnum
CREATE TYPE "ResourceType" AS ENUM ('LAB', 'ACTIVITY', 'INTERVIEW_QUESTIONS', 'READING', 'DOWNLOAD');

-- CreateTable
CREATE TABLE "lesson_resources" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "type" "ResourceType" NOT NULL DEFAULT 'READING',
    "title" TEXT NOT NULL,
    "body" TEXT,
    "url" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lesson_resources_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lesson_resources_lessonId_type_idx" ON "lesson_resources"("lessonId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_resources_lessonId_sortOrder_key" ON "lesson_resources"("lessonId", "sortOrder");

-- AddForeignKey
ALTER TABLE "lesson_resources" ADD CONSTRAINT "lesson_resources_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
