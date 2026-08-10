import crypto from "node:crypto";
import { z } from "zod";
import { config } from "@/lib/config";
import { AppError } from "@/shared/errors";

export const telegramUserSchema = z.object({
  id: z.number(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  username: z.string().optional(),
  photo_url: z
    .string()
    .optional()
    .transform((value) => (value && value.startsWith("http") ? value : undefined)),
  language_code: z.string().optional()
});

export type TelegramUser = z.infer<typeof telegramUserSchema>;

export function validateTelegramInitData(initData: string, botToken = config.TELEGRAM_BOT_TOKEN): TelegramUser {
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");

  if (!hash) {
    throw new AppError("UNAUTHORIZED", "Missing Telegram hash", 401);
  }

  params.delete("hash");
  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secretKey = crypto.createHmac("sha256", "WebAppData").update(botToken).digest();
  const calculatedHash = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

  if (hash.length !== calculatedHash.length || !crypto.timingSafeEqual(Buffer.from(calculatedHash, "hex"), Buffer.from(hash, "hex"))) {
    throw new AppError("UNAUTHORIZED", "Invalid Telegram signature", 401);
  }

  const authDate = Number(params.get("auth_date"));
  const maxAgeSeconds = 24 * 60 * 60;
  if (!Number.isFinite(authDate) || Date.now() / 1000 - authDate > maxAgeSeconds) {
    throw new AppError("UNAUTHORIZED", "Expired Telegram auth data", 401);
  }

  const rawUser = params.get("user");
  if (!rawUser) {
    throw new AppError("UNAUTHORIZED", "Missing Telegram user", 401);
  }

  return telegramUserSchema.parse(JSON.parse(rawUser));
}
