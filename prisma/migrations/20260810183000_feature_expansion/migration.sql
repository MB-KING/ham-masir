-- AlterEnum
ALTER TYPE "XPTransactionType" ADD VALUE 'SPEND_REWARD';
ALTER TYPE "XPTransactionType" ADD VALUE 'ADMIN_ADJUSTMENT';

-- AlterEnum
ALTER TYPE "RewardType" ADD VALUE 'GIFT';
ALTER TYPE "RewardType" ADD VALUE 'CREDIT';
ALTER TYPE "RewardType" ADD VALUE 'SPECIAL_OFFER';

-- CreateEnum
CREATE TYPE "MediaProvider" AS ENUM ('TELEGRAM', 'URL');
CREATE TYPE "TelegramResourceType" AS ENUM ('GROUP', 'CHANNEL');
CREATE TYPE "TelegramMembershipStatus" AS ENUM ('MEMBER', 'LEFT', 'KICKED', 'RESTRICTED', 'ADMIN', 'CREATOR', 'UNKNOWN');

-- AlterTable Community
ALTER TABLE "Community" ADD COLUMN "leaderboardEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Community" ADD COLUMN "autoAnnounceEnabled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable User
ALTER TABLE "User" ADD COLUMN "workCategoryId" TEXT;

-- AlterTable UserProfile
ALTER TABLE "UserProfile" ADD COLUMN "skills" TEXT;
ALTER TABLE "UserProfile" ADD COLUMN "socialLinks" JSONB;
ALTER TABLE "UserProfile" ADD COLUMN "showSkills" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "UserProfile" ADD COLUMN "showSocialLinks" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "UserProfile" ADD COLUMN "showWorkCategory" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "WorkCategory" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkCategory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StepRule" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "type" "XPTransactionType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StepRule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL,
    "provider" "MediaProvider" NOT NULL DEFAULT 'TELEGRAM',
    "telegramFileId" TEXT,
    "telegramFileUniqueId" TEXT,
    "url" TEXT,
    "mimeType" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "uploaderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EventImage" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "mediaAssetId" TEXT NOT NULL,
    "caption" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventImage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EventFeedback" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventFeedback_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TelegramResource" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "link" TEXT NOT NULL,
    "type" "TelegramResourceType" NOT NULL,
    "telegramChatId" BIGINT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "receiveAnnouncements" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TelegramResource_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TelegramGroupMembership" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT,
    "userId" TEXT,
    "telegramUserId" BIGINT NOT NULL,
    "chatId" BIGINT NOT NULL,
    "status" "TelegramMembershipStatus" NOT NULL DEFAULT 'UNKNOWN',
    "joinedAt" TIMESTAMP(3),
    "leftAt" TIMESTAMP(3),
    "lastCheckedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TelegramGroupMembership_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EventAnnouncement" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "telegramMessageId" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventAnnouncement_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE UNIQUE INDEX "WorkCategory_communityId_slug_key" ON "WorkCategory"("communityId", "slug");
CREATE INDEX "WorkCategory_communityId_isActive_sortOrder_idx" ON "WorkCategory"("communityId", "isActive", "sortOrder");

CREATE UNIQUE INDEX "StepRule_communityId_type_key" ON "StepRule"("communityId", "type");

CREATE INDEX "MediaAsset_provider_createdAt_idx" ON "MediaAsset"("provider", "createdAt");

CREATE INDEX "EventImage_eventId_sortOrder_idx" ON "EventImage"("eventId", "sortOrder");

CREATE UNIQUE INDEX "EventFeedback_eventId_userId_key" ON "EventFeedback"("eventId", "userId");
CREATE INDEX "EventFeedback_eventId_createdAt_idx" ON "EventFeedback"("eventId", "createdAt");

CREATE INDEX "TelegramResource_communityId_isActive_sortOrder_idx" ON "TelegramResource"("communityId", "isActive", "sortOrder");

CREATE UNIQUE INDEX "TelegramGroupMembership_chatId_telegramUserId_key" ON "TelegramGroupMembership"("chatId", "telegramUserId");
CREATE INDEX "TelegramGroupMembership_resourceId_status_idx" ON "TelegramGroupMembership"("resourceId", "status");
CREATE INDEX "TelegramGroupMembership_userId_idx" ON "TelegramGroupMembership"("userId");

CREATE UNIQUE INDEX "EventAnnouncement_eventId_resourceId_key" ON "EventAnnouncement"("eventId", "resourceId");
CREATE INDEX "EventAnnouncement_resourceId_sentAt_idx" ON "EventAnnouncement"("resourceId", "sentAt");

CREATE INDEX "User_communityId_xp_idx" ON "User"("communityId", "xp");
CREATE INDEX "User_communityId_workCategoryId_idx" ON "User"("communityId", "workCategoryId");

-- ForeignKeys
ALTER TABLE "User" ADD CONSTRAINT "User_workCategoryId_fkey" FOREIGN KEY ("workCategoryId") REFERENCES "WorkCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "WorkCategory" ADD CONSTRAINT "WorkCategory_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "StepRule" ADD CONSTRAINT "StepRule_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "EventImage" ADD CONSTRAINT "EventImage_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EventImage" ADD CONSTRAINT "EventImage_mediaAssetId_fkey" FOREIGN KEY ("mediaAssetId") REFERENCES "MediaAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EventFeedback" ADD CONSTRAINT "EventFeedback_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EventFeedback" ADD CONSTRAINT "EventFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TelegramResource" ADD CONSTRAINT "TelegramResource_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "TelegramGroupMembership" ADD CONSTRAINT "TelegramGroupMembership_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "TelegramResource"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TelegramGroupMembership" ADD CONSTRAINT "TelegramGroupMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "EventAnnouncement" ADD CONSTRAINT "EventAnnouncement_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EventAnnouncement" ADD CONSTRAINT "EventAnnouncement_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "TelegramResource"("id") ON DELETE CASCADE ON UPDATE CASCADE;
