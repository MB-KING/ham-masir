import { config } from "@/lib/config";
import { logger } from "@/lib/logger";

const apiBase = `https://api.telegram.org/bot${config.TELEGRAM_BOT_TOKEN}`;

type TelegramPhotoSize = {
  file_id: string;
  file_unique_id: string;
  width: number;
  height: number;
  file_size?: number;
};

type TelegramFile = {
  file_id: string;
  file_unique_id: string;
  file_path?: string;
  file_size?: number;
};

async function callTelegramJson<T>(
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

async function callTelegramForm<T>(method: string, form: FormData): Promise<T> {
  const response = await fetch(`${apiBase}/${method}`, {
    method: "POST",
    body: form,
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

function storageChatId() {
  return (
    config.TELEGRAM_STORAGE_CHAT_ID ||
    process.env.TELEGRAM_STORAGE_CHAT_ID ||
    ""
  ).trim();
}

export async function uploadPhotoToTelegramStorage(input: {
  buffer: Buffer;
  filename: string;
  contentType: string;
  caption?: string;
}) {
  const chatId = storageChatId();
  if (!chatId) {
    throw new Error("TELEGRAM_STORAGE_CHAT_ID is not configured");
  }

  const form = new FormData();
  form.append("chat_id", chatId);
  if (input.caption) form.append("caption", input.caption);

  // Blob + filename is the most reliable multipart shape on Node/Vercel.
  const bytes = Uint8Array.from(input.buffer);
  form.append(
    "photo",
    new Blob([bytes], { type: input.contentType }),
    input.filename || "photo.jpg"
  );

  const message = await callTelegramForm<{
    photo?: TelegramPhotoSize[];
  }>("sendPhoto", form);

  const sizes = message.photo ?? [];
  const best = sizes[sizes.length - 1];
  if (!best) {
    throw new Error("Telegram did not return a photo file_id");
  }

  return {
    fileId: best.file_id,
    fileUniqueId: best.file_unique_id,
    width: best.width,
    height: best.height,
    mimeType: input.contentType
  };
}

export async function resolveTelegramFile(fileId: string) {
  const file = await callTelegramJson<TelegramFile>("getFile", {
    file_id: fileId
  });
  if (!file.file_path) {
    throw new Error("Telegram file_path unavailable");
  }
  const url = `https://api.telegram.org/file/bot${config.TELEGRAM_BOT_TOKEN}/${file.file_path}`;
  return { ...file, url };
}

export async function fetchTelegramFileBytes(fileId: string) {
  const resolved = await resolveTelegramFile(fileId);
  const response = await fetch(resolved.url, { cache: "no-store" });
  if (!response.ok) {
    logger.warn("telegram_file_fetch_failed", {
      status: response.status,
      fileId
    });
    throw new Error("Failed to download telegram file");
  }
  const contentType =
    response.headers.get("content-type") ?? "application/octet-stream";
  const buffer = Buffer.from(await response.arrayBuffer());
  return { buffer, contentType, filePath: resolved.file_path };
}
