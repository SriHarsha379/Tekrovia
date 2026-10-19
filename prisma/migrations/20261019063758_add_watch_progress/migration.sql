-- AlterTable
ALTER TABLE "lesson_progress" ADD COLUMN     "lastPositionSeconds" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "watchedSeconds" INTEGER NOT NULL DEFAULT 0;
