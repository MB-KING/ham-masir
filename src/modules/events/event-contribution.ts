import { AttendanceStatus, EventStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/shared/errors";

export async function assertEventContributionAllowed(
  userId: string,
  eventId: string
) {
  const [event, attendance] = await Promise.all([
    prisma.event.findFirst({
      where: { id: eventId, deletedAt: null },
      select: { id: true, status: true, title: true, eventNumber: true }
    }),
    prisma.attendance.findUnique({
      where: { userId_eventId: { userId, eventId } }
    })
  ]);

  if (!event) throw new AppError("EVENT_NOT_FOUND", "Event not found");
  if (event.status !== EventStatus.COMPLETED) {
    throw new AppError("FEEDBACK_NOT_ALLOWED", "Event not completed");
  }
  if (!attendance || attendance.status !== AttendanceStatus.PRESENT) {
    throw new AppError("FEEDBACK_NOT_ALLOWED", "Attendance required");
  }

  return event;
}
