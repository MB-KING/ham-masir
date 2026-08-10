import { config } from "@/lib/config";
import { logger } from "@/lib/logger";
import {
  formatStartMessageHtml,
  isGroupOrChannelChat,
  telegramDeepLink
} from "@/lib/telegram-format";

const apiBase = `https://api.telegram.org/bot${config.TELEGRAM_BOT_TOKEN}`;

async function callTelegram<T>(
  method: string,
  body?: Record<string, unknown>
): Promise<T> {
  const response = await fetch(`${apiBase}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store"
  });
  const payload = (await response.json()) as {
    ok: boolean;
    description?: string;
    result: T;
  };
  if (!payload.ok) {
    throw new Error(payload.description ?? `Telegram API failed: ${method}`);
  }
  return payload.result;
}

export function appPublicUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "https://test.mbking.info"
  );
}

function buildAppKeyboard(input: {
  chatId: string;
  eventPath?: string;
  buttonText?: string;
}) {
  const label = input.buttonText ?? "باز کردن هم مسیر";
  const webAppUrl = input.eventPath
    ? `${appPublicUrl()}${input.eventPath}`
    : appPublicUrl();

  // web_app buttons only work in private chats with the bot.
  if (isGroupOrChannelChat(input.chatId)) {
    return {
      inline_keyboard: [
        [{ text: label, url: telegramDeepLink(input.eventPath) }]
      ]
    };
  }

  return {
    inline_keyboard: [[{ text: label, web_app: { url: webAppUrl } }]]
  };
}

export async function setupTelegramBot() {
  const url = appPublicUrl();

  await callTelegram("setMyCommands", {
    commands: [
      { command: "start", description: "شروع هم مسیر" },
      { command: "app", description: "باز کردن مینی‌اپ" },
      { command: "help", description: "راهنما" },
      { command: "addgroup", description: "ثبت گروه فعلی (سوپرادمین)" },
      { command: "removegroup", description: "غیرفعال‌سازی گروه (سوپرادمین)" },
      { command: "groupstatus", description: "وضعیت گروه (سوپرادمین)" }
    ]
  });

  await callTelegram("setChatMenuButton", {
    menu_button: {
      type: "web_app",
      text: "هم مسیر",
      web_app: { url }
    }
  });

  await callTelegram("setWebhook", {
    url: `${url}/api/telegram/webhook`,
    allowed_updates: ["message", "my_chat_member", "chat_member"]
  });

  return { appUrl: url, webhook: `${url}/api/telegram/webhook` };
}

export async function sendStartMessage(chatId: number | string | bigint) {
  const id = chatId.toString();
  return callTelegram("sendMessage", {
    chat_id: id,
    text: formatStartMessageHtml(),
    parse_mode: "HTML",
    disable_web_page_preview: true,
    reply_markup: buildAppKeyboard({
      chatId: id,
      buttonText: "ورود به هم مسیر"
    })
  });
}

export async function sendTelegramMessage(input: {
  chatId: number | string | bigint;
  text: string;
  openApp?: boolean;
  eventPath?: string;
  buttonText?: string;
  parseMode?: "HTML";
}) {
  const chatId = input.chatId.toString();
  const keyboard = input.openApp
    ? buildAppKeyboard({
        chatId,
        eventPath: input.eventPath,
        buttonText: input.buttonText
      })
    : undefined;

  try {
    return await callTelegram("sendMessage", {
      chat_id: chatId,
      text: input.text,
      parse_mode: input.parseMode,
      disable_web_page_preview: true,
      reply_markup: keyboard
    });
  } catch (error) {
    logger.warn("telegram_send_failed", {
      chatId,
      reason: error instanceof Error ? error.message : "unknown"
    });
    return null;
  }
}
