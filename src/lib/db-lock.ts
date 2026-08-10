import type { Prisma } from "@prisma/client";

type Tx = Pick<Prisma.TransactionClient, "$queryRaw">;

/** Row-lock helpers for PostgreSQL (Prisma default table/column quoting). */
export async function lockEventRow(tx: Tx, eventId: string) {
  return tx.$queryRaw<{ id: string }[]>`
    SELECT id FROM "Event"
    WHERE id = ${eventId} AND "deletedAt" IS NULL
    FOR UPDATE
  `;
}

export async function lockRewardRow(tx: Tx, rewardId: string) {
  return tx.$queryRaw<{ id: string }[]>`
    SELECT id FROM "Reward"
    WHERE id = ${rewardId}
    FOR UPDATE
  `;
}

export async function lockNextRewardCode(tx: Tx, rewardId: string) {
  return tx.$queryRaw<{ id: string; code: string }[]>`
    SELECT id, code FROM "RewardCode"
    WHERE "rewardId" = ${rewardId} AND "isRedeemed" = false
    ORDER BY "createdAt" ASC
    LIMIT 1
    FOR UPDATE
  `;
}
