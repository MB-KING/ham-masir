import type { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type Tx = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

export class LevelService {
  constructor(private readonly db: PrismaClient = prisma) {}

  async calculateLevel(userId: string, xp: number, db: Tx = this.db) {
    const user = await db.user.findUnique({ where: { id: userId }, select: { communityId: true } });
    if (!user) {
      return 1;
    }

    const level = await db.level.findFirst({
      where: { communityId: user.communityId, requiredXP: { lte: xp }, isActive: true },
      orderBy: { requiredXP: "desc" }
    });

    return level?.level ?? 1;
  }
}
