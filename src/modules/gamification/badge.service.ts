import { BadgeType, PrismaClient, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ROLE_BADGES } from "@/shared/role-badges";

export class BadgeService {
  constructor(private readonly db: PrismaClient = prisma) {}

  async syncCommunityRoleBadges(communityId: string) {
    const [host, lead, users] = await Promise.all([
      this.ensureRoleBadge(communityId, ROLE_BADGES.host),
      this.ensureRoleBadge(communityId, ROLE_BADGES.lead),
      this.db.user.findMany({
        where: { communityId, deletedAt: null },
        select: { id: true, roles: { select: { role: true } } }
      })
    ]);

    for (const user of users) {
      const roles = user.roles.map((item) => item.role);
      const isSuper = roles.includes(Role.SUPER_ADMIN);
      const isHost = isSuper || roles.includes(Role.ADMIN);
      await this.setRoleBadge(user.id, host.id, isHost);
      await this.setRoleBadge(user.id, lead.id, isSuper);
    }
  }

  async syncUserRoleBadges(userId: string) {
    const user = await this.db.user.findUnique({
      where: { id: userId },
      select: {
        communityId: true,
        roles: { select: { role: true } }
      }
    });
    if (!user) return;
    const [host, lead] = await Promise.all([
      this.ensureRoleBadge(user.communityId, ROLE_BADGES.host),
      this.ensureRoleBadge(user.communityId, ROLE_BADGES.lead)
    ]);
    const roles = user.roles.map((item) => item.role);
    const isSuper = roles.includes(Role.SUPER_ADMIN);
    const isHost = isSuper || roles.includes(Role.ADMIN);
    await this.setRoleBadge(userId, host.id, isHost);
    await this.setRoleBadge(userId, lead.id, isSuper);
  }

  private async ensureRoleBadge(
    communityId: string,
    badge: { slug: string; name: string; description: string }
  ) {
    return this.db.badge.upsert({
      where: { communityId_slug: { communityId, slug: badge.slug } },
      update: {
        name: badge.name,
        description: badge.description,
        type: BadgeType.SPECIAL,
        isActive: true
      },
      create: {
        communityId,
        slug: badge.slug,
        name: badge.name,
        description: badge.description,
        type: BadgeType.SPECIAL,
        threshold: 0,
        isActive: true,
        sortOrder: 0
      }
    });
  }

  private async setRoleBadge(userId: string, badgeId: string, enabled: boolean) {
    if (enabled) {
      await this.db.userBadge.upsert({
        where: { userId_badgeId: { userId, badgeId } },
        update: {},
        create: { userId, badgeId }
      });
      return;
    }
    await this.db.userBadge.deleteMany({ where: { userId, badgeId } });
  }


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
