import { config } from "@/lib/config";
import { logger } from "@/lib/logger";

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

export async function setupTelegramBot() {
  const url = appPublicUrl();

  await callTelegram("setMyCommands", {
    commands: [
      { command: "start", description: "Start Ham Masir" },
      { command: "app", description: "Open Mini App" },
      { command: "help", description: "Help" },
      { command: "addgroup", description: "Register current group (super admin)" },
      { command: "removegroup", description: "Disable current group (super admin)" },
      { command: "groupstatus", description: "Show group status (super admin)" }
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
  const url = appPublicUrl();
  return callTelegram("sendMessage", {
    chat_id: chatId.toString(),
    text:
      "به هم مسیر خوش آمدی.\n\nبرای ورود و استفاده از اپ، دکمه زیر را بزن و مینی‌اپ را باز کن.",
    reply_markup: {
      inline_keyboard: [
        [{ text: "🚀 باز کردن هم مسیر", web_app: { url } }],
        [{ text: "سایت", url }]
      ]
    }
  });
}

export async function sendTelegramMessage(input: {
  chatId: number | string | bigint;
  text: string;
  openApp?: boolean;
  eventPath?: string;
}) {
  const url = appPublicUrl();
  const appUrl = input.eventPath ? `${url}${input.eventPath}` : url;
  const keyboard = input.openApp
    ? {
        inline_keyboard: [
          [{ text: "باز کردن هم مسیر", web_app: { url: appUrl } }]
        ]
      }
    : undefined;

  try {
    return await callTelegram("sendMessage", {
      chat_id: input.chatId.toString(),
      text: input.text,
      reply_markup: keyboard
    });
  } catch (error) {
    logger.warn("telegram_send_failed", {
      chatId: input.chatId.toString(),
      reason: error instanceof Error ? error.message : "unknown"
    });
    return null;
  }
}
