import { RegistrationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { RegistrationRepository } from "@/modules/registrations/registration.repository";
import { AppError } from "@/shared/errors";
import { resolveRegistrationStatus } from "@/modules/registrations/registration.policy";
import { notifyUser } from "@/modules/activity/activity.service";

async function lockEvent(tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0], eventId: string) {
  const rows = await tx.$queryRaw<{ id: string }[]>`
    SELECT id FROM \`Event\` WHERE id = ${eventId} AND deletedAt IS NULL FOR UPDATE
  `;
  if (rows.length === 0) {
    throw new AppError("EVENT_NOT_FOUND", "Event not found", 404);
  }
}

export class RegistrationService {
  async register(userId: string, eventId: string) {
    const registration = await prisma.$transaction(async (tx) => {
      await lockEvent(tx, eventId);

      const event = await tx.event.findFirst({
        where: { id: eventId, deletedAt: null }
      });
      if (!event) {
        throw new AppError("EVENT_NOT_FOUND", "Event not found", 404);
      }

      const repository = new RegistrationRepository(tx);
      const existing = await repository.findActive(userId, eventId);
      const count = await repository.countRegistered(eventId);
      const status = resolveRegistrationStatus({
        eventStatus: event.status,
        registrationDeadline: event.registrationDeadline,
        capacity: event.capacity,
        registeredCount: count,
        existingStatus: existing?.status
      });

      return {
        registration: await repository.upsertRegistered(userId, eventId, status),
        status,
        eventTitle: event.title
      };
    });

    await notifyUser({
      userId,
      type: "REGISTRATION_UPDATED",
      title:
        registration.status === RegistrationStatus.WAITLISTED
          ? "در لیست انتظار قرار گرفتی"
          : "ثبت‌نام انجام شد",
      body: registration.eventTitle
    });

    return registration.registration;
  }

  async cancel(userId: string, eventId: string) {
    const result = await prisma.$transaction(async (tx) => {
      await lockEvent(tx, eventId);

      const event = await tx.event.findFirst({
        where: { id: eventId, deletedAt: null }
      });
      if (!event) {
        throw new AppError("EVENT_NOT_FOUND", "Event not found", 404);
      }

      const repository = new RegistrationRepository(tx);
      const existing = await repository.findActive(userId, eventId);
      if (!existing || existing.status === RegistrationStatus.CANCELLED) {
        throw new AppError(
          "REGISTRATION_NOT_FOUND",
          "Registration not found",
          404
        );
      }

      const cancelled = await repository.cancel(userId, eventId);
      let promotedUserId: string | null = null;

      if (existing.status === RegistrationStatus.REGISTERED) {
        const waitlisted = await repository.findFirstWaitlisted(eventId);
        if (waitlisted) {
          await repository.promote(waitlisted.id);
          promotedUserId = waitlisted.userId;
        }
      }

      return {
        cancelled,
        eventTitle: event.title,
        promotedUserId
      };
    });

    await notifyUser({
      userId,
      type: "REGISTRATION_CANCELLED",
      title: "ثبت‌نام لغو شد",
      body: result.eventTitle
    });

    if (result.promotedUserId) {
      await notifyUser({
        userId: result.promotedUserId,
        type: "WAITLIST_PROMOTED",
        title: "جای تو در برنامه قطعی شد",
        body: result.eventTitle
      });
    }

    return result.cancelled;
  }
}
