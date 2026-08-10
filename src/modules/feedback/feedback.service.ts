import { AttendanceStatus, EventStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/shared/errors";

export class FeedbackService {
  async upsert(input: {
    userId: string;
    eventId: string;
    rating: number;
    comment?: string | null;
  }) {
    if (input.rating < 1 || input.rating > 5) {
      throw new AppError("VALIDATION_ERROR", "Rating must be 1-5");
    }

    const [event, attendance] = await Promise.all([
      prisma.event.findFirst({
        where: { id: input.eventId, deletedAt: null },
        select: { id: true, status: true }
      }),
      prisma.attendance.findUnique({
        where: {
          userId_eventId: { userId: input.userId, eventId: input.eventId }
        }
      })
    ]);

    if (!event) throw new AppError("EVENT_NOT_FOUND", "Event not found");
    if (event.status !== EventStatus.COMPLETED) {
      throw new AppError("FEEDBACK_NOT_ALLOWED", "Event not completed");
    }
    if (!attendance || attendance.status !== AttendanceStatus.PRESENT) {
      throw new AppError("FEEDBACK_NOT_ALLOWED", "Attendance required");
    }

    return prisma.eventFeedback.upsert({
      where: {
        eventId_userId: { eventId: input.eventId, userId: input.userId }
      },
      create: {
        eventId: input.eventId,
        userId: input.userId,
        rating: input.rating,
        comment: input.comment?.trim() || null
      },
      update: {
        rating: input.rating,
        comment: input.comment?.trim() || null
      }
    });
  }

  async listForEvent(eventId: string) {
    return prisma.eventFeedback.findMany({
      where: { eventId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            photoUrl: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });
  }

  async statsForEvent(eventId: string) {
    const agg = await prisma.eventFeedback.aggregate({
      where: { eventId },
      _avg: { rating: true },
      _count: { _all: true }
    });
    return {
      average: agg._avg.rating ?? 0,
      count: agg._count._all
    };
  }
}
