import { prisma } from "@/lib/prisma";
import { EventRepository } from "@/modules/events/event.repository";
import type { createEventSchema } from "@/modules/events/event.schema";
import type { z } from "zod";
import { AppError } from "@/shared/errors";
import { logActivity } from "@/modules/activity/activity.service";

export class EventService {
  constructor(private readonly repository = new EventRepository(prisma)) {}

  listPublished(take: number, skip: number) {
    return this.repository.findPublished(take, skip);
  }

  async getEvent(id: string) {
    const event = await this.repository.findById(id);
    if (!event) {
      throw new AppError("EVENT_NOT_FOUND", "Event not found", 404);
    }
    return event;
  }

  async getPublicEvent(id: string) {
    const event = await this.repository.findPublicById(id);
    if (!event) {
      throw new AppError("EVENT_NOT_FOUND", "Event not found", 404);
    }
    return event;
  }

  async createEvent(
    communityId: string,
    createdById: string,
    input: z.infer<typeof createEventSchema>
  ) {
    const event = await this.repository.create(communityId, createdById, input);
    await logActivity({
      actorUserId: createdById,
      action: "EVENT_CREATED",
      entityType: "Event",
      entityId: event.id,
      metadata: { title: event.title }
    });
    return event;
  }
}
