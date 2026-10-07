-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "utmCampaign" TEXT,
ADD COLUMN     "utmMedium" TEXT,
ADD COLUMN     "utmSource" TEXT;

-- AlterTable
ALTER TABLE "OtpCode" ADD COLUMN     "verifiedAt" TIMESTAMP(3);
