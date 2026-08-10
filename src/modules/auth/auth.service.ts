import { prisma } from "@/lib/prisma";
import { AuthRepository } from "@/modules/auth/auth.repository";
import { validateTelegramInitData } from "@/modules/auth/telegram";

export class AuthService {
  constructor(private readonly repository = new AuthRepository(prisma)) {}

  async loginWithTelegram(initData: string) {
    const telegramUser = validateTelegramInitData(initData);
    return this.repository.upsertTelegramUser(telegramUser);
  }
}
