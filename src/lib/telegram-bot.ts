import { config } from "@/lib/config";

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
      { command: "start", description: "شروع و باز کردن هم مسیر" },
      { command: "app", description: "باز کردن مینی‌اپ هم مسیر" },
      { command: "help", description: "راهنمای کوتاه" }
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
    allowed_updates: ["message"]
  });

  return { appUrl: url, webhook: `${url}/api/telegram/webhook` };
}

export async function sendStartMessage(chatId: number) {
  const url = appPublicUrl();
  return callTelegram("sendMessage", {
    chat_id: chatId,
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
