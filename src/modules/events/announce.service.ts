import { EventStatus, Prisma } from "@prisma/client";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { appPublicUrl, sendTelegramMessage } from "@/lib/telegram-bot";
import { formatEventAnnounceHtml } from "@/lib/telegram-format";

type AnnounceEvent = {
  id: string;
  communityId: string;
  title: string;
  eventNumber: number;
  date: Date;
  meetingTime: Date;
  startTime: Date;
  locationName: string;
  description: string | null;
  status: EventStatus;
};

export async function announcePublishedEvent(event: AnnounceEvent) {
  if (event.status !== EventStatus.PUBLISHED) return;

  try {
    const community = await prisma.community.findUnique({
      where: { id: event.communityId },
      select: { autoAnnounceEnabled: true }
    });
    if (!community?.autoAnnounceEnabled) {
      logger.info("event_announce_skipped_disabled", { eventId: event.id });
      return;
    }

    const resources = await prisma.telegramResource.findMany({
      where: {
        communityId: event.communityId,
        isActive: true,
        receiveAnnouncements: true,
        telegramChatId: { not: null }
      }
    });

    if (resources.length === 0) {
      logger.warn("event_announce_no_targets", { eventId: event.id });
      return;
    }

    const text = formatEventAnnounceHtml(event);

    for (const resource of resources) {
      if (!resource.telegramChatId) continue;

      const existing = await prisma.eventAnnouncement.findUnique({
        where: {
          eventId_resourceId: {
            eventId: event.id,
            resourceId: resource.id
          }
        }
      });
      if (existing) continue;

      const result = await sendTelegramMessage({
        chatId: resource.telegramChatId,
        text,
        parseMode: "HTML",
        openApp: true,
        eventPath: `/events/${event.id}`,
        buttonText: "مشاهده و ثبت‌نام"
      });

      if (!result) {
        logger.warn("event_announce_failed", {
          eventId: event.id,
          resourceId: resource.id,
          chatId: resource.telegramChatId.toString()
        });
        continue;
      }

      try {
        await prisma.eventAnnouncement.create({
          data: {
            eventId: event.id,
            resourceId: resource.id,
            telegramMessageId:
              typeof result === "object" && result && "message_id" in result
                ? String((result as { message_id: number }).message_id)
                : null
          }
        });
        logger.info("event_announce_sent", {
          eventId: event.id,
          resourceId: resource.id,
          chatId: resource.telegramChatId.toString()
        });
      } catch (error) {
        if (
          !(
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002"
          )
        ) {
          logger.warn("event_announce_record_failed", {
            eventId: event.id,
            reason: error instanceof Error ? error.message : "unknown"
          });
        }
      }
    }
  } catch (error) {
    logger.warn("event_announce_unexpected", {
      eventId: event.id,
      reason: error instanceof Error ? error.message : "unknown",
      appUrl: appPublicUrl()
    });
  }
}
