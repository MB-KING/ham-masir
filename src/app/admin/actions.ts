"use server";

import {
  AttendanceStatus,
  BadgeType,
  BusinessStatus,
  EventStatus,
  RewardRedemptionStatus,
  RewardStatus,
  RewardType,
  Role,
  TelegramResourceType,
  XPTransactionType
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  requireEventManagerPage,
  requireSuperAdminPage
} from "@/modules/auth/admin-session";
import { AttendanceService } from "@/modules/attendance/attendance.service";
import { announcePublishedEvent } from "@/modules/events/announce.service";
import { EventService } from "@/modules/events/event.service";
import { MediaService } from "@/modules/media/media.service";
import { logActivity, notifyUser } from "@/modules/activity/activity.service";
import { earnStepTypes } from "@/shared/steps";

const optionalPositiveInt = z.preprocess(
  (value) => (value === "" || value == null ? undefined : value),
  z.coerce.number().int().positive().optional()
);
const optionalNumber = z.preprocess(
  (value) => (value === "" || value == null ? undefined : value),
  z.coerce.number().optional()
);

const eventFormSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  eventNumber: z.coerce.number().int().positive(),
  date: z.string().min(10),
  meetingTime: z.string().min(5),
  startTime: z.string().min(5),
  endTime: z.string().optional(),
  registrationDeadline: z.string().optional(),
  checkInStartsAt: z.string().optional(),
  checkInEndsAt: z.string().optional(),
  locationName: z.string().min(2),
  locationAddress: z.string().optional(),
  latitude: optionalNumber.pipe(z.number().min(-90).max(90).optional()),
  longitude: optionalNumber.pipe(z.number().min(-180).max(180).optional()),
  capacity: optionalPositiveInt,
  status: z.nativeEnum(EventStatus)
});

const businessFormSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  website: z.string().optional(),
  instagram: z.string().optional(),
  status: z.nativeEnum(BusinessStatus)
});

const rewardFormSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(3),
  type: z.nativeEnum(RewardType),
  discountValue: z.string().optional(),
  discountCode: z.string().optional(),
  image: z.string().url().optional().or(z.literal("")),
  startAt: z.string().min(10),
  expireAt: z.string().min(10),
  minimumAttendance: optionalPositiveInt,
  minimumLevel: optionalPositiveInt,
  requiredXP: optionalPositiveInt,
  usageLimit: optionalPositiveInt,
  perUserLimit: optionalPositiveInt,
  status: z.nativeEnum(RewardStatus)
});

const communityFormSchema = z.object({
  name: z.string().min(2),
  tagline: z.string().max(160).optional(),
  isActive: z.preprocess((value) => value === "on", z.boolean()),
  leaderboardEnabled: z.preprocess((value) => value === "on", z.boolean()),
  autoAnnounceEnabled: z.preprocess((value) => value === "on", z.boolean())
});

const levelFormSchema = z.object({
  levelId: z.string().uuid().optional().or(z.literal("")),
  level: z.coerce.number().int().positive(),
  requiredXP: z.coerce.number().int().nonnegative(),
  name: z.string().max(80).optional(),
  isActive: z.preprocess((value) => value === "on", z.boolean())
});

const badgeFormSchema = z.object({
  name: z.string().min(2),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  icon: z.string().optional(),
  type: z.nativeEnum(BadgeType),
  threshold: z.coerce.number().int().positive(),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.preprocess((value) => value === "on", z.boolean())
});

function toDate(date: string, time = "00:00") {
  return new Date(`${date}T${time.length === 5 ? `${time}:00` : time}`);
}

function optionalDateTime(value?: string) {
  return value ? new Date(value) : undefined;
}

export async function createEventAction(formData: FormData) {
  const admin = await requireEventManagerPage();
  const input = eventFormSchema.parse(Object.fromEntries(formData));

  const event = await new EventService().createEvent(
    admin.communityId,
    admin.id,
    {
      title: input.title,
      description: input.description || undefined,
      eventNumber: input.eventNumber,
      date: toDate(input.date),
      meetingTime: toDate(input.date, input.meetingTime),
      startTime: toDate(input.date, input.startTime),
      endTime: input.endTime ? toDate(input.date, input.endTime) : undefined,
      registrationDeadline: optionalDateTime(input.registrationDeadline),
      checkInStartsAt: optionalDateTime(input.checkInStartsAt),
      checkInEndsAt: optionalDateTime(input.checkInEndsAt),
      locationName: input.locationName,
      locationAddress: input.locationAddress || undefined,
      latitude: input.latitude,
      longitude: input.longitude,
      capacity: input.capacity,
      status: input.status
    }
  );
  if (event.status === EventStatus.PUBLISHED) {
    void announcePublishedEvent(event);
  }
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/events");
  redirect("/admin/events");
}

export async function updateEventAction(formData: FormData) {
  const admin = await requireSuperAdminPage();
  const eventId = z.string().uuid().parse(formData.get("eventId"));
  const input = eventFormSchema.parse(Object.fromEntries(formData));

  const event = await prisma.event.update({
    where: { id: eventId },
    data: {
      title: input.title,
      description: input.description || null,
      eventNumber: input.eventNumber,
      date: toDate(input.date),
      meetingTime: toDate(input.date, input.meetingTime),
      startTime: toDate(input.date, input.startTime),
      endTime: input.endTime ? toDate(input.date, input.endTime) : null,
      registrationDeadline:
        optionalDateTime(input.registrationDeadline) ?? null,
      checkInStartsAt: optionalDateTime(input.checkInStartsAt) ?? null,
      checkInEndsAt: optionalDateTime(input.checkInEndsAt) ?? null,
      locationName: input.locationName,
      locationAddress: input.locationAddress || null,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      capacity: input.capacity ?? null,
      status: input.status
    }
  });
  await logActivity({
    actorUserId: admin.id,
    action: "EVENT_UPDATED",
    entityType: "Event",
    entityId: eventId,
    metadata: { title: input.title }
  });
  if (event.status === EventStatus.PUBLISHED) {
    void announcePublishedEvent(event);
  }

  revalidatePath("/");
  revalidatePath("/admin/events");
  redirect("/admin/events");
}

export async function setEventStatusAction(formData: FormData) {
  const admin = await requireEventManagerPage();
  const eventId = z.string().uuid().parse(formData.get("eventId"));
  const status = z.nativeEnum(EventStatus).parse(formData.get("status"));
  const event = await prisma.event.update({
    where: { id: eventId },
    data: { status }
  });
  await logActivity({
    actorUserId: admin.id,
    action: "EVENT_STATUS_CHANGED",
    entityType: "Event",
    entityId: eventId,
    metadata: { status }
  });
  if (status === EventStatus.PUBLISHED) {
    void announcePublishedEvent(event);
  }
  revalidatePath("/");
  revalidatePath("/admin/events");
}

export async function verifyAttendanceAction(formData: FormData) {
  const admin = await requireEventManagerPage();
  const eventId = z.string().uuid().parse(formData.get("eventId"));
  const userId = z.string().uuid().parse(formData.get("userId"));
  const status = z
    .nativeEnum(AttendanceStatus)
    .parse(formData.get("status") ?? AttendanceStatus.PRESENT);

  await new AttendanceService().verify({
    eventId,
    userId,
    verifiedById: admin.id,
    status
  });
  revalidatePath("/admin/events");
  revalidatePath(`/admin/events/${eventId}/attendance`);
}

export async function setBusinessStatusAction(formData: FormData) {
  const admin = await requireSuperAdminPage();
  const businessId = z.string().uuid().parse(formData.get("businessId"));
  const status = z.nativeEnum(BusinessStatus).parse(formData.get("status"));
  await prisma.business.update({
    where: { id: businessId },
    data: {
      status,
      approvedById: status === BusinessStatus.APPROVED ? admin.id : null,
      approvedAt: status === BusinessStatus.APPROVED ? new Date() : null
    }
  });
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { createdById: true, name: true }
  });
  if (business)
    await notifyUser({
      userId: business.createdById,
      type: "BUSINESS_STATUS_CHANGED",
      title: "وضعیت کسب‌وکار تغییر کرد",
      body: `${business.name}: ${status}`
    });
  await logActivity({
    actorUserId: admin.id,
    action: "BUSINESS_STATUS_CHANGED",
    entityType: "Business",
    entityId: businessId,
    metadata: { status }
  });
  revalidatePath("/admin/businesses");
}

export async function updateBusinessAction(formData: FormData) {
  const admin = await requireSuperAdminPage();
  const businessId = z.string().uuid().parse(formData.get("businessId"));
  const input = businessFormSchema.parse(Object.fromEntries(formData));
  await prisma.business.update({
    where: { id: businessId },
    data: {
      name: input.name,
      description: input.description || null,
      website: input.website || null,
      instagram: input.instagram || null,
      status: input.status
    }
  });
  await logActivity({
    actorUserId: admin.id,
    action: "BUSINESS_UPDATED",
    entityType: "Business",
    entityId: businessId,
    metadata: { name: input.name }
  });
  revalidatePath("/admin/businesses");
  redirect("/admin/businesses");
}

export async function setRewardStatusAction(formData: FormData) {
  const admin = await requireSuperAdminPage();
  const rewardId = z.string().uuid().parse(formData.get("rewardId"));
  const status = z.nativeEnum(RewardStatus).parse(formData.get("status"));
  await prisma.reward.update({
    where: { id: rewardId },
    data: {
      status,
      approvedById: status === RewardStatus.APPROVED ? admin.id : null,
      approvedAt: status === RewardStatus.APPROVED ? new Date() : null
    }
  });
  const reward = await prisma.reward.findUnique({
    where: { id: rewardId },
    select: { createdById: true, title: true }
  });
  if (reward)
    await notifyUser({
      userId: reward.createdById,
      type: "REWARD_STATUS_CHANGED",
      title: "وضعیت مزیت تغییر کرد",
      body: `${reward.title}: ${status}`
    });
  await logActivity({
    actorUserId: admin.id,
    action: "REWARD_STATUS_CHANGED",
    entityType: "Reward",
    entityId: rewardId,
    metadata: { status }
  });
  revalidatePath("/");
  revalidatePath("/admin/rewards");
}

export async function updateRewardAction(formData: FormData) {
  const admin = await requireSuperAdminPage();
  const rewardId = z.string().uuid().parse(formData.get("rewardId"));
  const input = rewardFormSchema.parse(Object.fromEntries(formData));
  await prisma.reward.update({
    where: { id: rewardId },
    data: {
      title: input.title,
      description: input.description,
      type: input.type,
      discountValue: input.discountValue || null,
      discountCode: input.discountCode || null,
      image: input.image || null,
      startAt: toDate(input.startAt),
      expireAt: toDate(input.expireAt),
      minimumAttendance: input.minimumAttendance ?? null,
      minimumLevel: input.minimumLevel ?? null,
      requiredXP: input.requiredXP ?? null,
      usageLimit: input.usageLimit ?? null,
      perUserLimit: input.perUserLimit ?? null,
      status: input.status
    }
  });
  await logActivity({
    actorUserId: admin.id,
    action: "REWARD_UPDATED",
    entityType: "Reward",
    entityId: rewardId,
    metadata: { title: input.title }
  });
  revalidatePath("/");
  revalidatePath("/admin/rewards");
  redirect("/admin/rewards");
}

export async function setUserRoleAction(formData: FormData) {
  const admin = await requireSuperAdminPage();
  const userId = z.string().uuid().parse(formData.get("userId"));
  const role = z.nativeEnum(Role).parse(formData.get("role"));
  const allowedRoles: Role[] = [Role.USER, Role.ADMIN, Role.SUPER_ADMIN];

  if (!allowedRoles.includes(role)) {
    throw new Error("نقش انتخاب‌شده معتبر نیست.");
  }

  await prisma.$transaction([
    prisma.userRole.deleteMany({ where: { userId } }),
    prisma.userRole.create({ data: { userId, role } })
  ]);
  await logActivity({
    actorUserId: admin.id,
    action: "USER_ROLE_CHANGED",
    entityType: "User",
    entityId: userId,
    metadata: { role }
  });

  revalidatePath("/admin/users");
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function createBadgeAction(formData: FormData) {
  const admin = await requireSuperAdminPage();
  const input = badgeFormSchema.parse(Object.fromEntries(formData));
  await prisma.badge.create({
    data: {
      communityId: admin.communityId,
      name: input.name,
      slug: input.slug,
      description: input.description || null,
      icon: input.icon || null,
      type: input.type,
      threshold: input.threshold,
      sortOrder: input.sortOrder,
      isActive: input.isActive
    }
  });
  await logActivity({
    actorUserId: admin.id,
    action: "BADGE_CREATED",
    entityType: "Badge",
    metadata: { name: input.name, slug: input.slug }
  });
  revalidatePath("/admin/badges");
}

export async function updateBadgeAction(formData: FormData) {
  const admin = await requireSuperAdminPage();
  const badgeId = z.string().uuid().parse(formData.get("badgeId"));
  const input = badgeFormSchema.parse(Object.fromEntries(formData));
  await prisma.badge.update({
    where: { id: badgeId },
    data: {
      name: input.name,
      slug: input.slug,
      description: input.description || null,
      icon: input.icon || null,
      type: input.type,
      threshold: input.threshold,
      sortOrder: input.sortOrder,
      isActive: input.isActive
    }
  });
  await logActivity({
    actorUserId: admin.id,
    action: "BADGE_UPDATED",
    entityType: "Badge",
    entityId: badgeId,
    metadata: { name: input.name }
  });
  revalidatePath("/admin/badges");
}

export async function updateCommunityAction(formData: FormData) {
  const admin = await requireSuperAdminPage();
  const input = communityFormSchema.parse(Object.fromEntries(formData));
  await prisma.community.update({
    where: { id: admin.communityId },
    data: input
  });
  await logActivity({
    actorUserId: admin.id,
    action: "COMMUNITY_UPDATED",
    entityType: "Community",
    entityId: admin.communityId,
    metadata: { name: input.name, isActive: input.isActive }
  });
  revalidatePath("/");
  revalidatePath("/admin/settings");
}

export async function upsertLevelAction(formData: FormData) {
  const admin = await requireSuperAdminPage();
  const input = levelFormSchema.parse(Object.fromEntries(formData));
  const data = {
    level: input.level,
    requiredXP: input.requiredXP,
    name: input.name || null,
    isActive: input.isActive
  };
  const level = input.levelId
    ? await prisma.level.update({ where: { id: input.levelId }, data })
    : await prisma.level.upsert({
        where: {
          communityId_level: {
            communityId: admin.communityId,
            level: input.level
          }
        },
        update: data,
        create: { communityId: admin.communityId, ...data }
      });
  const [users, activeLevels] = await Promise.all([
    prisma.user.findMany({
      where: { communityId: admin.communityId, deletedAt: null },
      select: { id: true, xp: true }
    }),
    prisma.level.findMany({
      where: { communityId: admin.communityId, isActive: true },
      orderBy: { requiredXP: "desc" }
    })
  ]);
  await prisma.$transaction(
    users.map((user) => {
      const resolvedLevel =
        activeLevels.find((item) => item.requiredXP <= user.xp)?.level ?? 1;
      return prisma.user.update({
        where: { id: user.id },
        data: { level: resolvedLevel }
      });
    })
  );
  await logActivity({
    actorUserId: admin.id,
    action: "LEVEL_SAVED",
    entityType: "Level",
    entityId: level.id,
    metadata: { level: level.level, requiredXP: level.requiredXP }
  });
  revalidatePath("/admin/settings");
  revalidatePath("/me");
}

export async function addRewardCodesAction(formData: FormData) {
  const admin = await requireSuperAdminPage();
  const rewardId = z.string().uuid().parse(formData.get("rewardId"));
  const codes = z
    .string()
    .min(1)
    .parse(formData.get("codes"))
    .split(/\r?\n/)
    .map((code) => code.trim())
    .filter(Boolean);
  if (codes.length === 0) return;
  await prisma.rewardCode.createMany({
    data: [...new Set(codes)].map((code) => ({ rewardId, code })),
    skipDuplicates: true
  });
  await logActivity({
    actorUserId: admin.id,
    action: "REWARD_CODES_ADDED",
    entityType: "Reward",
    entityId: rewardId,
    metadata: { count: codes.length }
  });
  revalidatePath(`/admin/rewards/${rewardId}/edit`);
  revalidatePath("/admin/rewards");
}

export async function setRedemptionStatusAction(formData: FormData) {
  const admin = await requireSuperAdminPage();
  const redemptionId = z.string().uuid().parse(formData.get("redemptionId"));
  const status = z
    .nativeEnum(RewardRedemptionStatus)
    .parse(formData.get("status"));

  const redemption = await prisma.$transaction(async (tx) => {
    const current = await tx.rewardRedemption.findUnique({
      where: { id: redemptionId },
      include: { reward: true }
    });
    if (!current) {
      throw new Error("ردمپشن پیدا نشد.");
    }

    const releasesCode =
      (status === RewardRedemptionStatus.CANCELLED ||
        status === RewardRedemptionStatus.EXPIRED) &&
      Boolean(current.rewardCodeId) &&
      (current.status === RewardRedemptionStatus.REDEEMED ||
        current.status === RewardRedemptionStatus.RESERVED);

    const updated = await tx.rewardRedemption.update({
      where: { id: redemptionId },
      data: {
        status,
        redeemedAt:
          status === RewardRedemptionStatus.REDEEMED ? new Date() : null,
        ...(releasesCode ? { rewardCodeId: null } : {})
      },
      include: { reward: true }
    });

    if (releasesCode && current.rewardCodeId) {
      await tx.rewardCode.update({
        where: { id: current.rewardCodeId },
        data: { isRedeemed: false }
      });
    }

    return updated;
  });

  await Promise.all([
    logActivity({
      actorUserId: admin.id,
      action: "REDEMPTION_STATUS_CHANGED",
      entityType: "RewardRedemption",
      entityId: redemption.id,
      metadata: { status }
    }),
    notifyUser({
      userId: redemption.userId,
      type: "REDEMPTION_STATUS_CHANGED",
      title: "وضعیت مزیت تغییر کرد",
      body: `${redemption.reward.title}: ${status}`
    })
  ]);
  revalidatePath(`/admin/rewards/${redemption.rewardId}/edit`);
  revalidatePath("/me");
  revalidatePath("/rewards");
}

export async function assignSpecialBadgeAction(formData: FormData) {
  const admin = await requireSuperAdminPage();
  const userId = z.string().uuid().parse(formData.get("userId"));
  const badgeId = z.string().uuid().parse(formData.get("badgeId"));
  const badge = await prisma.badge.findFirst({
    where: {
      id: badgeId,
      communityId: admin.communityId,
      type: BadgeType.SPECIAL,
      isActive: true
    }
  });
  if (!badge) throw new Error("بج ویژه معتبر نیست.");
  await prisma.userBadge.upsert({
    where: { userId_badgeId: { userId, badgeId } },
    update: {},
    create: { userId, badgeId }
  });
  await Promise.all([
    logActivity({
      actorUserId: admin.id,
      action: "SPECIAL_BADGE_ASSIGNED",
      entityType: "UserBadge",
      entityId: badgeId,
      metadata: { userId, badge: badge.name }
    }),
    notifyUser({
      userId,
      type: "BADGE_EARNED",
      title: "بج ویژه گرفتی",
      body: badge.name
    })
  ]);
  revalidatePath("/admin/users");
  revalidatePath("/me");
}

export async function revokeSpecialBadgeAction(formData: FormData) {
  const admin = await requireSuperAdminPage();
  const userId = z.string().uuid().parse(formData.get("userId"));
  const badgeId = z.string().uuid().parse(formData.get("badgeId"));
  await prisma.userBadge.deleteMany({
    where: {
      userId,
      badgeId,
      badge: { type: BadgeType.SPECIAL, communityId: admin.communityId }
    }
  });
  await logActivity({
    actorUserId: admin.id,
    action: "SPECIAL_BADGE_REVOKED",
    entityType: "UserBadge",
    entityId: badgeId,
    metadata: { userId }
  });
  revalidatePath("/admin/users");
  revalidatePath("/me");
}

export async function upsertStepRuleAction(formData: FormData) {
  const admin = await requireSuperAdminPage();
  const type = z.nativeEnum(XPTransactionType).parse(formData.get("type"));
  if (!earnStepTypes.includes(type)) {
    throw new Error("نوع قانون گام معتبر نیست.");
  }
  const amount = z.coerce.number().int().nonnegative().parse(formData.get("amount"));
  await prisma.stepRule.upsert({
    where: {
      communityId_type: { communityId: admin.communityId, type }
    },
    update: { amount },
    create: { communityId: admin.communityId, type, amount }
  });
  revalidatePath("/admin/settings");
}

export async function upsertWorkCategoryAction(formData: FormData) {
  const admin = await requireSuperAdminPage();
  const id = z.string().uuid().optional().or(z.literal("")).parse(formData.get("id") ?? "");
  const name = z.string().min(2).parse(formData.get("name"));
  const slug = z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/)
    .parse(formData.get("slug"));
  const sortOrder = z.coerce.number().int().parse(formData.get("sortOrder") ?? 0);
  const isActive = formData.get("isActive") === "on";
  if (id) {
    await prisma.workCategory.update({
      where: { id },
      data: { name, slug, sortOrder, isActive }
    });
  } else {
    await prisma.workCategory.create({
      data: {
        communityId: admin.communityId,
        name,
        slug,
        sortOrder,
        isActive
      }
    });
  }
  revalidatePath("/admin/categories");
  revalidatePath("/members");
  revalidatePath("/me/settings");
}

export async function upsertTelegramResourceAction(formData: FormData) {
  const admin = await requireSuperAdminPage();
  const id = z.string().uuid().optional().or(z.literal("")).parse(formData.get("id") ?? "");
  const data = {
    name: z.string().min(2).parse(formData.get("name")),
    description: z.string().optional().parse(formData.get("description") ?? "") || null,
    link: z.string().url().parse(formData.get("link")),
    type: z.nativeEnum(TelegramResourceType).parse(formData.get("type")),
    sortOrder: z.coerce.number().int().parse(formData.get("sortOrder") ?? 0),
    isActive: formData.get("isActive") === "on",
    receiveAnnouncements: formData.get("receiveAnnouncements") === "on",
    telegramChatId: (() => {
      const raw = String(formData.get("telegramChatId") ?? "").trim();
      return raw ? BigInt(raw) : null;
    })()
  };
  if (id) {
    await prisma.telegramResource.update({ where: { id }, data });
  } else {
    await prisma.telegramResource.create({
      data: { communityId: admin.communityId, ...data }
    });
  }
  revalidatePath("/admin/telegram");
  revalidatePath("/community");
}

export async function deleteTelegramResourceAction(formData: FormData) {
  const admin = await requireSuperAdminPage();
  const id = z.string().uuid().parse(formData.get("id"));
  await prisma.telegramResource.updateMany({
    where: { id, communityId: admin.communityId },
    data: { isActive: false }
  });
  revalidatePath("/admin/telegram");
  revalidatePath("/community");
}

export async function uploadEventImageAction(formData: FormData) {
  const admin = await requireSuperAdminPage();
  const eventId = z.string().uuid().parse(formData.get("eventId"));
  const caption = z.string().max(200).optional().parse(formData.get("caption") ?? "");
  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("تصویر معتبر نیست.");
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  const asset = await new MediaService().createFromUpload({
    uploaderId: admin.id,
    buffer,
    filename: file.name || "event.jpg",
    mimeType: file.type || "image/jpeg"
  });
  const count = await prisma.eventImage.count({ where: { eventId } });
  await prisma.eventImage.create({
    data: {
      eventId,
      mediaAssetId: asset.id,
      caption: caption || null,
      sortOrder: count
    }
  });
  revalidatePath(`/admin/events/${eventId}/edit`);
  revalidatePath(`/events/${eventId}`);
}
