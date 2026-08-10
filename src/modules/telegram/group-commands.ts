import {
  Role,
  TelegramMembershipStatus,
  TelegramResourceType
} from "@prisma/client";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { sendTelegramMessage } from "@/lib/telegram-bot";

type Chat = {
  id: number;
  type?: string;
  title?: string;
  username?: string;
};

type FromUser = {
  id: number;
  username?: string;
  first_name?: string;
};

async function findSuperAdminByTelegramId(telegramId: number) {
  return prisma.user.findFirst({
    where: {
      telegramId: BigInt(telegramId),
      deletedAt: null,
      roles: { some: { role: Role.SUPER_ADMIN } }
    }
  });
}

function groupLink(chat: Chat) {
  if (chat.username) return `https://t.me/${chat.username}`;
  return `https://t.me/c/${String(chat.id).replace("-100", "")}`;
}

export async function handleGroupAdminCommand(input: {
  text: string;
  chat: Chat;
  from?: FromUser;
}) {
  const text = input.text.trim();
  const command = text.split(/\s+/)[0]?.replace(/@\w+$/i, "").toLowerCase();
  if (!command?.startsWith("/")) return false;

  const isGroup =
    input.chat.type === "group" || input.chat.type === "supergroup";

  if (
    command !== "/addgroup" &&
    command !== "/removegroup" &&
    command !== "/groupstatus"
  ) {
    return false;
  }

  if (!input.from) {
    await sendTelegramMessage({
      chatId: input.chat.id,
      text: "شناسه کاربر مشخص نیست."
    });
    return true;
  }

  const admin = await findSuperAdminByTelegramId(input.from.id);
  if (!admin) {
    await sendTelegramMessage({
      chatId: input.chat.id,
      text: "فقط سوپرادمین معتبر هم مسیر می‌تواند این دستور را اجرا کند."
    });
    return true;
  }

  if (!isGroup) {
    await sendTelegramMessage({
      chatId: input.chat.id,
      text: "این دستور را داخل گروه اجرا کن."
    });
    return true;
  }

  if (command === "/addgroup") {
    const existing = await prisma.telegramResource.findFirst({
      where: {
        communityId: admin.communityId,
        telegramChatId: BigInt(input.chat.id)
      }
    });

    const resource = existing
      ? await prisma.telegramResource.update({
          where: { id: existing.id },
          data: {
            name: input.chat.title ?? existing.name,
            link: groupLink(input.chat),
            isActive: true,
            type: TelegramResourceType.GROUP,
            receiveAnnouncements: true
          }
        })
      : await prisma.telegramResource.create({
          data: {
            communityId: admin.communityId,
            name: input.chat.title ?? "گروه هم مسیر",
            description: "ثبت‌شده از دستور /addgroup",
            link: groupLink(input.chat),
            type: TelegramResourceType.GROUP,
            telegramChatId: BigInt(input.chat.id),
            isActive: true,
            receiveAnnouncements: true
          }
        });

    await sendTelegramMessage({
      chatId: input.chat.id,
      text: `گروه «${resource.name}» در هم مسیر ثبت شد.`
    });
    return true;
  }

  if (command === "/removegroup") {
    const updated = await prisma.telegramResource.updateMany({
      where: {
        communityId: admin.communityId,
        telegramChatId: BigInt(input.chat.id)
      },
      data: { isActive: false, receiveAnnouncements: false }
    });
    await sendTelegramMessage({
      chatId: input.chat.id,
      text:
        updated.count > 0
          ? "گروه از منابع فعال هم مسیر حذف (غیرفعال) شد."
          : "این گروه در سیستم ثبت نشده بود."
    });
    return true;
  }

  const resource = await prisma.telegramResource.findFirst({
    where: {
      communityId: admin.communityId,
      telegramChatId: BigInt(input.chat.id)
    }
  });
  await sendTelegramMessage({
    chatId: input.chat.id,
    text: resource
      ? [
          `وضعیت گروه: ${resource.isActive ? "فعال" : "غیرفعال"}`,
          `اعلان خودکار: ${resource.receiveAnnouncements ? "روشن" : "خاموش"}`,
          `شناسه چت: ${input.chat.id}`
        ].join("\n")
      : `گروه ثبت نشده. Chat ID: ${input.chat.id}`
  });
  return true;
}

export async function trackMembershipUpdate(input: {
  chatId: number;
  telegramUserId: number;
  status: string;
}) {
  try {
    const mapped =
      input.status === "member" || input.status === "restricted"
        ? TelegramMembershipStatus.MEMBER
        : input.status === "administrator"
          ? TelegramMembershipStatus.ADMIN
          : input.status === "creator"
            ? TelegramMembershipStatus.CREATOR
            : input.status === "left"
              ? TelegramMembershipStatus.LEFT
              : input.status === "kicked"
                ? TelegramMembershipStatus.KICKED
                : TelegramMembershipStatus.UNKNOWN;

    const user = await prisma.user.findUnique({
      where: { telegramId: BigInt(input.telegramUserId) },
      select: { id: true }
    });
    const resource = await prisma.telegramResource.findFirst({
      where: { telegramChatId: BigInt(input.chatId) },
      select: { id: true }
    });

    const now = new Date();
    const active =
      mapped === TelegramMembershipStatus.MEMBER ||
      mapped === TelegramMembershipStatus.ADMIN ||
      mapped === TelegramMembershipStatus.CREATOR;

    await prisma.telegramGroupMembership.upsert({
      where: {
        chatId_telegramUserId: {
          chatId: BigInt(input.chatId),
          telegramUserId: BigInt(input.telegramUserId)
        }
      },
      create: {
        chatId: BigInt(input.chatId),
        telegramUserId: BigInt(input.telegramUserId),
        status: mapped,
        userId: user?.id,
        resourceId: resource?.id,
        joinedAt: active ? now : null,
        leftAt: active ? null : now,
        lastCheckedAt: now
      },
      update: {
        status: mapped,
        userId: user?.id,
        resourceId: resource?.id,
        leftAt: active ? null : now,
        ...(active ? { joinedAt: now } : {}),
        lastCheckedAt: now
      }
    });
  } catch (error) {
    logger.warn("membership_track_failed", {
      reason: error instanceof Error ? error.message : "unknown"
    });
  }
}
