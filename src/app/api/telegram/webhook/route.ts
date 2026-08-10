import { NextResponse } from "next/server";
import { sendStartMessage } from "@/lib/telegram-bot";
import {
  handleGroupAdminCommand,
  trackMembershipUpdate
} from "@/modules/telegram/group-commands";

type TelegramUpdate = {
  message?: {
    chat?: { id?: number; type?: string; title?: string; username?: string };
    from?: { id?: number; username?: string; first_name?: string };
    text?: string;
  };
  my_chat_member?: {
    chat?: { id?: number };
    new_chat_member?: { user?: { id?: number }; status?: string };
  };
  chat_member?: {
    chat?: { id?: number };
    new_chat_member?: { user?: { id?: number }; status?: string };
  };
};

export async function POST(request: Request) {
  try {
    const update = (await request.json()) as TelegramUpdate;
    const message = update.message;
    const chatId = message?.chat?.id;
    const text = message?.text?.trim() ?? "";

    if (message?.chat && text) {
      const handled = await handleGroupAdminCommand({
        text,
        chat: {
          id: message.chat.id!,
          type: message.chat.type,
          title: message.chat.title,
          username: message.chat.username
        },
        from: message.from?.id
          ? {
              id: message.from.id,
              username: message.from.username,
              first_name: message.from.first_name
            }
          : undefined
      });
      if (handled) {
        return NextResponse.json({ ok: true });
      }
    }

    if (
      chatId &&
      (/^\/start(?:@\w+)?/i.test(text) ||
        /^\/app(?:@\w+)?/i.test(text) ||
        /^\/help(?:@\w+)?/i.test(text))
    ) {
      await sendStartMessage(chatId);
    }

    const membership =
      update.chat_member?.new_chat_member ??
      update.my_chat_member?.new_chat_member;
    const membershipChatId =
      update.chat_member?.chat?.id ?? update.my_chat_member?.chat?.id;
    if (membership?.user?.id && membershipChatId && membership.status) {
      await trackMembershipUpdate({
        chatId: membershipChatId,
        telegramUserId: membership.user.id,
        status: membership.status
      });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
