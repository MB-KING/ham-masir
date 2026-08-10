import { sendStartMessage } from "@/lib/telegram-bot";
import { NextResponse } from "next/server";

type TelegramUpdate = {
  message?: {
    chat?: { id?: number };
    text?: string;
  };
};

export async function POST(request: Request) {
  try {
    const update = (await request.json()) as TelegramUpdate;
    const chatId = update.message?.chat?.id;
    const text = update.message?.text?.trim() ?? "";

    if (chatId && (/^\/start(?:@\w+)?/i.test(text) || /^\/app(?:@\w+)?/i.test(text) || /^\/help(?:@\w+)?/i.test(text))) {
      await sendStartMessage(chatId);
    }

    return NextResponse.json({ ok: true });
  } catch {
    // Always ack Telegram so it doesn't retry forever.
    return NextResponse.json({ ok: true });
  }
}
