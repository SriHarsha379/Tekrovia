/*
  Warnings:

  - You are about to drop the `placement_recoveries` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "placement_recoveries" DROP CONSTRAINT "placement_recoveries_candidateId_fkey";

-- DropTable
DROP TABLE "placement_recoveries";

-- DropEnum
DROP TYPE "RecoveryStatus";
