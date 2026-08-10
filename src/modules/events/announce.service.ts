import { EventStatus, Prisma } from "@prisma/client";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { appPublicUrl, sendTelegramMessage } from "@/lib/telegram-bot";

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

const dateFormatter = new Intl.DateTimeFormat("fa-IR", {
  weekday: "long",
  month: "long",
  day: "numeric"
});
const timeFormatter = new Intl.DateTimeFormat("fa-IR", {
  hour: "2-digit",
  minute: "2-digit"
});

export async function announcePublishedEvent(event: AnnounceEvent) {
  if (event.status !== EventStatus.PUBLISHED) return;

  try {
    const community = await prisma.community.findUnique({
      where: { id: event.communityId },
      select: { autoAnnounceEnabled: true }
    });
    if (!community?.autoAnnounceEnabled) return;

    const resources = await prisma.telegramResource.findMany({
      where: {
        communityId: event.communityId,
        isActive: true,
        receiveAnnouncements: true,
        telegramChatId: { not: null }
      }
    });

    const text = [
      `🆕 برنامه جدید هم مسیر`,
      ``,
      `📍 ${event.title}`,
      `شماره ${event.eventNumber}`,
      `🗓 ${dateFormatter.format(event.date)}`,
      `⏰ ${timeFormatter.format(event.meetingTime)}`,
      `📌 ${event.locationName}`,
      event.description ? `\n${event.description.slice(0, 180)}` : "",
      ``,
      `برای مشاهده و ثبت‌نام دکمه زیر را بزن.`
    ]
      .filter(Boolean)
      .join("\n");

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
        openApp: true,
        eventPath: `/events/${event.id}`
      });

      if (!result) {
        logger.warn("event_announce_failed", {
          eventId: event.id,
          resourceId: resource.id
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
