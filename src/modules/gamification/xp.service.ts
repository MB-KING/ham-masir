import { PrismaClient, XPTransactionType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { LevelService } from "@/modules/gamification/level.service";

export const xpRules: Record<XPTransactionType, number> = {
  ATTEND_EVENT: 100,
  REFER_USER: 50,
  CREATE_REWARD: 75,
  COMPLETE_PROFILE: 25,
  ATTEND_SPECIAL_EVENT: 150
};

export class XPService {
  constructor(
    private readonly db: PrismaClient = prisma,
    private readonly levelService = new LevelService(db)
  ) {}

  async award(
    userId: string,
    type: XPTransactionType,
    referenceType: string,
    referenceId: string,
    description?: string
  ) {
    const amount = xpRules[type];

    return this.db.$transaction(async (tx) => {
      const transaction = await tx.xPTransaction.upsert({
        where: {
          userId_type_referenceType_referenceId: {
            userId,
            type,
            referenceType,
            referenceId
          }
        },
        update: {},
        create: {
          userId,
          type,
          referenceType,
          referenceId,
          amount,
          description
        }
      });

      const totalXP = await tx.xPTransaction.aggregate({
        where: { userId },
        _sum: { amount: true }
      });
      const level = await this.levelService.calculateLevel(
        userId,
        totalXP._sum.amount ?? 0,
        tx
      );
      await tx.user.update({
        where: { id: userId },
        data: { xp: totalXP._sum.amount ?? 0, level }
      });
      await this.syncXPBadges(tx, userId, totalXP._sum.amount ?? 0);
      return transaction;
    });
  }

  async revoke(
    userId: string,
    type: XPTransactionType,
    referenceType: string,
    referenceId: string
  ) {
    return this.db.$transaction(async (tx) => {
      await tx.xPTransaction.deleteMany({
        where: { userId, type, referenceType, referenceId }
      });
      const totalXP = await tx.xPTransaction.aggregate({
        where: { userId },
        _sum: { amount: true }
      });
      const xp = totalXP._sum.amount ?? 0;
      const level = await this.levelService.calculateLevel(userId, xp, tx);
      await tx.user.update({ where: { id: userId }, data: { xp, level } });
      await this.syncXPBadges(tx, userId, xp);
      return { xp, level };
    });
  }

  private async syncXPBadges(
    db: Parameters<LevelService["calculateLevel"]>[2] & {},
    userId: string,
    xp: number
  ) {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { communityId: true }
    });
    if (!user) return;
    const badges = await db.badge.findMany({
      where: { communityId: user.communityId, type: "XP", isActive: true }
    });
    const eligible = badges.filter((badge) => badge.threshold <= xp);
    const ineligibleIds = badges
      .filter((badge) => badge.threshold > xp)
      .map((badge) => badge.id);
    if (ineligibleIds.length)
      await db.userBadge.deleteMany({
        where: { userId, badgeId: { in: ineligibleIds } }
      });
    for (const badge of eligible) {
      await db.userBadge.upsert({
        where: { userId_badgeId: { userId, badgeId: badge.id } },
        update: {},
        create: { userId, badgeId: badge.id }
      });
    }
  }
}
