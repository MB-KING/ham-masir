import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  TELEGRAM_INIT_COOKIE,
  TELEGRAM_INIT_HEADER
} from "@/modules/auth/telegram-cookie";
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

async function readInitData() {
  const headerValue = (await headers()).get(TELEGRAM_INIT_HEADER)?.trim();
  if (headerValue) {
    return headerValue;
  }

  const cookieValue = (await cookies()).get(TELEGRAM_INIT_COOKIE)?.value;
  return cookieValue?.trim() || null;
}

export async function requireCurrentUser() {
  const devUser = await resolveDevUser();
  if (devUser) {
    return devUser;
  }

  const initData = await readInitData();
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

export async function getOptionalCurrentUser() {
  try {
    return await requireCurrentUser();
  } catch (error) {
    if (error instanceof AppError && error.code === "UNAUTHORIZED") {
      return null;
    }
    throw error;
  }
}

export async function requireCurrentUserPage() {
  const user = await getOptionalCurrentUser();
  if (!user) {
    redirect("/open-in-telegram");
  }
  return user;
}
