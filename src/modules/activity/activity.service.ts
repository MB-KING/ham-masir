import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function logActivity(input: {
  actorUserId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Prisma.InputJsonValue;
}) {
  return prisma.auditLog.create({
    data: {
      actorUserId: input.actorUserId ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      metadata: input.metadata
    }
  });
}

export async function notifyUser(input: {
  userId: string;
  type: string;
  title: string;
  body: string;
}) {
  return prisma.notification.create({ data: input });
}
