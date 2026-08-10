import { Prisma, PrismaClient, RegistrationStatus } from "@prisma/client";

type DbClient = PrismaClient | Prisma.TransactionClient;

export class RegistrationRepository {
  constructor(private readonly db: DbClient) {}

  findActive(userId: string, eventId: string) {
    return this.db.eventRegistration.findUnique({
      where: { userId_eventId: { userId, eventId } }
    });
  }

  countRegistered(eventId: string) {
    return this.db.eventRegistration.count({
      where: { eventId, status: RegistrationStatus.REGISTERED }
    });
  }

  upsertRegistered(
    userId: string,
    eventId: string,
    status: RegistrationStatus
  ) {
    return this.db.eventRegistration.upsert({
      where: { userId_eventId: { userId, eventId } },
      update: { status, registeredAt: new Date(), cancelledAt: null },
      create: { userId, eventId, status }
    });
  }

  cancel(userId: string, eventId: string) {
    return this.db.eventRegistration.update({
      where: { userId_eventId: { userId, eventId } },
      data: { status: RegistrationStatus.CANCELLED, cancelledAt: new Date() }
    });
  }

  findFirstWaitlisted(eventId: string) {
    return this.db.eventRegistration.findFirst({
      where: { eventId, status: RegistrationStatus.WAITLISTED },
      orderBy: { registeredAt: "asc" }
    });
  }

  promote(registrationId: string) {
    return this.db.eventRegistration.update({
      where: { id: registrationId },
      data: {
        status: RegistrationStatus.REGISTERED,
        registeredAt: new Date(),
        cancelledAt: null
      }
    });
  }
}
