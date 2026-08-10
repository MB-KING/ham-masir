import { EventStatus, PrismaClient } from "@prisma/client";
import type { z } from "zod";
import type { createEventSchema } from "@/modules/events/event.schema";

export const publicEventStatuses: EventStatus[] = [
  EventStatus.PUBLISHED,
  EventStatus.REGISTRATION_CLOSED,
  EventStatus.COMPLETED
];

export class EventRepository {
  constructor(private readonly db: PrismaClient) {}

  findPublished(take: number, skip: number) {
    return this.db.event.findMany({
      where: { status: EventStatus.PUBLISHED, deletedAt: null },
      orderBy: { date: "asc" },
      take,
      skip,
      include: { _count: { select: { registrations: { where: { status: "REGISTERED" } } } } }
    });
  }

  findById(id: string) {
    return this.db.event.findFirst({
      where: { id, deletedAt: null },
      include: { _count: { select: { registrations: { where: { status: "REGISTERED" } } } } }
    });
  }

  findPublicById(id: string) {
    return this.db.event.findFirst({
      where: {
        id,
        deletedAt: null,
        status: { in: publicEventStatuses }
      },
      include: {
        _count: {
          select: { registrations: { where: { status: "REGISTERED" } } }
        }
      }
    });
  }

  create(communityId: string, createdById: string, input: z.infer<typeof createEventSchema>) {
    return this.db.event.create({
      data: {
        ...input,
        communityId,
        createdById,
        latitude: input.latitude,
        longitude: input.longitude
      }
    });
  }
}
