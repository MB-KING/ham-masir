import { AttendanceStatus, XPTransactionType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { XPService } from "@/modules/gamification/xp.service";
import { BadgeService } from "@/modules/gamification/badge.service";
import { logActivity, notifyUser } from "@/modules/activity/activity.service";

export class AttendanceService {
  constructor(
    private readonly xp = new XPService(),
    private readonly badges = new BadgeService()
  ) {}

  async verify(input: {
    userId: string;
    eventId: string;
    verifiedById: string;
    status: AttendanceStatus;
  }) {
    const existing = await prisma.attendance.findUnique({
      where: {
        userId_eventId: { userId: input.userId, eventId: input.eventId }
      }
    });

    if (existing?.status === input.status) {
      return existing;
    }

    const attendance = await prisma.attendance.upsert({
      where: {
        userId_eventId: { userId: input.userId, eventId: input.eventId }
      },
      update: {
        status: input.status,
        verificationMethod: "ADMIN",
        verifiedById: input.verifiedById,
        verifiedAt: new Date()
      },
      create: {
        userId: input.userId,
        eventId: input.eventId,
        status: input.status,
        verificationMethod: "ADMIN",
        verifiedById: input.verifiedById,
        verifiedAt: new Date()
      }
    });

    if (input.status === AttendanceStatus.PRESENT) {
      await this.xp.award(
        input.userId,
        XPTransactionType.ATTEND_EVENT,
        "Event",
        input.eventId,
        "حضور تایید شده در برنامه"
      );
      await this.badges.evaluateAttendanceBadges(input.userId);
    } else if (existing?.status === AttendanceStatus.PRESENT) {
      await this.xp.revoke(
        input.userId,
        XPTransactionType.ATTEND_EVENT,
        "Event",
        input.eventId
      );
      await this.badges.evaluateAttendanceBadges(input.userId);
    }

    const event = await prisma.event.findUnique({
      where: { id: input.eventId },
      select: { title: true }
    });
    await Promise.all([
      logActivity({
        actorUserId: input.verifiedById,
        action: "ATTENDANCE_UPDATED",
        entityType: "Attendance",
        entityId: attendance.id,
        metadata: {
          eventId: input.eventId,
          userId: input.userId,
          status: input.status
        }
      }),
      notifyUser({
        userId: input.userId,
        type: "ATTENDANCE_UPDATED",
        title:
          input.status === AttendanceStatus.PRESENT
            ? "✅ حضور تو تأیید شد"
            : "📋 وضعیت حضورت به‌روزرسانی شد",
        body:
          input.status === AttendanceStatus.PRESENT
            ? `حضور تو در «${event?.title ?? "برنامه"}» ثبت شد. دمت گرم! 🥾`
            : `وضعیت حضور «${event?.title ?? "برنامه"}»: ${attendanceStatusText(input.status)}`,
        eventPath: `/events/${input.eventId}`,
        buttonText: "👀 مشاهده برنامه"
      })
    ]);

    return attendance;
  }
}

function attendanceStatusText(status: AttendanceStatus) {
  if (status === AttendanceStatus.PRESENT) return "حاضر";
  if (status === AttendanceStatus.ABSENT) return "غایب";
  if (status === AttendanceStatus.REJECTED) return "رد شده";
  return "در انتظار بررسی";
}
