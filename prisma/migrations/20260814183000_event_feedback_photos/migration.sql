-- CreateEnum
CREATE TYPE "ModerationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterEnum
ALTER TYPE "XPTransactionType" ADD VALUE 'EVENT_PHOTO';

-- AlterTable
ALTER TABLE "EventFeedback" ADD COLUMN IF NOT EXISTS "status" "ModerationStatus" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "EventFeedback" ADD COLUMN IF NOT EXISTS "reviewedById" TEXT;
ALTER TABLE "EventFeedback" ADD COLUMN IF NOT EXISTS "reviewedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE IF NOT EXISTS "EventPhoto" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mediaAssetId" TEXT NOT NULL,
    "caption" TEXT,
    "status" "ModerationStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "EventFeedback_eventId_status_idx" ON "EventFeedback"("eventId", "status");
CREATE INDEX IF NOT EXISTS "EventPhoto_eventId_status_createdAt_idx" ON "EventPhoto"("eventId", "status", "createdAt");
CREATE INDEX IF NOT EXISTS "EventPhoto_userId_eventId_idx" ON "EventPhoto"("userId", "eventId");

-- AddForeignKey
ALTER TABLE "EventFeedback" DROP CONSTRAINT IF EXISTS "EventFeedback_reviewedById_fkey";
ALTER TABLE "EventFeedback" ADD CONSTRAINT "EventFeedback_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "EventPhoto" DROP CONSTRAINT IF EXISTS "EventPhoto_eventId_fkey";
ALTER TABLE "EventPhoto" ADD CONSTRAINT "EventPhoto_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EventPhoto" DROP CONSTRAINT IF EXISTS "EventPhoto_userId_fkey";
ALTER TABLE "EventPhoto" ADD CONSTRAINT "EventPhoto_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EventPhoto" DROP CONSTRAINT IF EXISTS "EventPhoto_mediaAssetId_fkey";
ALTER TABLE "EventPhoto" ADD CONSTRAINT "EventPhoto_mediaAssetId_fkey" FOREIGN KEY ("mediaAssetId") REFERENCES "MediaAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EventPhoto" DROP CONSTRAINT IF EXISTS "EventPhoto_reviewedById_fkey";
ALTER TABLE "EventPhoto" ADD CONSTRAINT "EventPhoto_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
