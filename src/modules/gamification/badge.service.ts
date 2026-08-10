import { BadgeType, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export class BadgeService {
  constructor(private readonly db: PrismaClient = prisma) {}

  async evaluateAttendanceBadges(userId: string) {
    const user = await this.db.user.findUnique({
      where: { id: userId },
      select: { communityId: true }
    });
    if (!user) {
      return [];
    }

    const attendanceCount = await this.db.attendance.count({
      where: { userId, status: "PRESENT" }
    });
    const badges = await this.db.badge.findMany({
      where: {
        communityId: user.communityId,
        type: BadgeType.ATTENDANCE_COUNT,
        isActive: true
      }
    });

    const eligible = badges.filter(
      (badge) => badge.threshold <= attendanceCount
    );
    const ineligibleIds = badges
      .filter((badge) => badge.threshold > attendanceCount)
      .map((badge) => badge.id);
    if (ineligibleIds.length > 0) {
      await this.db.userBadge.deleteMany({
        where: { userId, badgeId: { in: ineligibleIds } }
      });
    }

    return Promise.all(
      eligible.map((badge) =>
        this.db.userBadge.upsert({
          where: { userId_badgeId: { userId, badgeId: badge.id } },
          update: {},
          create: { userId, badgeId: badge.id }
        })
      )
    );
  }
}
