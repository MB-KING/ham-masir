import { config } from "@/lib/config";
import { setupTelegramBot } from "@/lib/telegram-bot";
import { fail, ok } from "@/shared/api";
import { AppError } from "@/shared/errors";

export async function POST(request: Request) {
  try {
    const auth = request.headers.get("authorization") ?? "";
    const expected = `Bearer ${config.TELEGRAM_BOT_TOKEN}`;
    if (auth !== expected) {
      throw new AppError("FORBIDDEN", "Forbidden", 403);
    }

    const result = await setupTelegramBot();
    return ok(result);
  } catch (error) {
    return fail(error);
  }
}
