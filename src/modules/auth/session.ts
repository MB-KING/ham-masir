import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { validateTelegramInitData } from "@/modules/auth/telegram";
import { AppError } from "@/shared/errors";

function isDevAuthAllowed() {
  return (
    process.env.NODE_ENV === "development" &&
    process.env.ALLOW_DEV_AUTH === "true"
  );
}

async function resolveDevUser() {
  if (!isDevAuthAllowed()) {
    return null;
  }

  const devTelegramId = process.env.DEV_TELEGRAM_ID?.trim();
  if (!devTelegramId) {
    return null;
  }

  return prisma.user.findFirst({
    where: { telegramId: BigInt(devTelegramId), deletedAt: null },
    include: { roles: true }
  });
}

export async function requireCurrentUser() {
  const devUser = await resolveDevUser();
  if (devUser) {
    return devUser;
  }

  const initData = (await headers()).get("x-telegram-init-data");
  if (!initData) {
    throw new AppError("UNAUTHORIZED", "Missing Telegram init data", 401);
  }

  const telegramUser = validateTelegramInitData(initData);
  const user = await prisma.user.findUnique({
    where: { telegramId: BigInt(telegramUser.id) },
    include: { roles: true }
  });

  if (!user || user.deletedAt) {
    throw new AppError("UNAUTHORIZED", "User not found", 401);
  }

  // Keep Telegram profile photo/name in sync for the profile screen.
  const nextPhotoUrl = telegramUser.photo_url ?? null;
  if (
    nextPhotoUrl !== user.photoUrl ||
    (telegramUser.username ?? null) !== user.username ||
    telegramUser.first_name !== user.firstName ||
    (telegramUser.last_name ?? null) !== user.lastName
  ) {
    return prisma.user.update({
      where: { id: user.id },
      data: {
        photoUrl: nextPhotoUrl,
        username: telegramUser.username ?? null,
        firstName: telegramUser.first_name,
        lastName: telegramUser.last_name ?? null
      },
      include: { roles: true }
    });
  }

  return user;
}

export async function requireCurrentUserPage() {
  return requireCurrentUser();
}
