/** Client-safe Telegram text helpers (no server secrets). */

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function pathFromStartParam(param: string): string | null {
  const value = param.trim();
  if (!value || value === "home") return "/";

  if (value.startsWith("e_")) {
    const id = value.slice(2);
    if (/^[0-9a-f-]{36}$/i.test(id)) {
      return `/events/${id}`;
    }
  }

  if (value.includes("__")) {
    return `/${value.replace(/__/g, "/")}`;
  }

  return null;
}

export function isGroupOrChannelChat(chatId: number | string | bigint) {
  try {
    return BigInt(chatId.toString()) < 0n;
  } catch {
    return String(chatId).startsWith("-");
  }
}

export function formatNotificationHtml(title: string, body: string) {
  return `<b>${escapeHtml(title)}</b>\n\n${escapeHtml(body)}`;
}

const faDateFormatter = new Intl.DateTimeFormat("fa-IR", {
  timeZone: "Asia/Tehran",
  weekday: "long",
  month: "long",
  day: "numeric"
});

const faTimeFormatter = new Intl.DateTimeFormat("fa-IR", {
  timeZone: "Asia/Tehran",
  hour: "2-digit",
  minute: "2-digit"
});

export function formatEventAnnounceHtml(event: {
  title: string;
  eventNumber: number;
  date: Date;
  meetingTime: Date;
  startTime: Date;
  locationName: string;
  description?: string | null;
}) {
  const lines = [
    "🥾 <b>برنامه جدید هم مسیر</b>",
    "",
    `<b>${escapeHtml(event.title)}</b>`,
    `شماره ${escapeHtml(String(event.eventNumber))}`,
    "",
    `📅 ${escapeHtml(faDateFormatter.format(event.date))}`,
    `🕐 جمع شدن: ${escapeHtml(faTimeFormatter.format(event.meetingTime))}`,
    `🚶 شروع مسیر: ${escapeHtml(faTimeFormatter.format(event.startTime))}`,
    `📍 ${escapeHtml(event.locationName)}`
  ];

  const description = event.description?.trim();
  if (description) {
    lines.push("", escapeHtml(description.slice(0, 220)));
  }

  lines.push("", "برای مشاهده جزئیات و ثبت‌نام، دکمه زیر را بزن.");
  return lines.join("\n");
}

export function formatStartMessageHtml() {
  return [
    "👋 <b>به هم مسیر خوش آمدی</b>",
    "",
    "اینجا برنامه‌های پیاده‌روی و دورهمی‌ها را می‌بینی، ثبت‌نام می‌کنی و با بقیه همراه می‌شوی.",
    "",
    "برای ورود، دکمه زیر را بزن."
  ].join("\n");
}

export function botUsername() {
  return (
    process.env.TELEGRAM_BOT_USERNAME ??
    process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ??
    "HamMasirClubBot"
  ).replace(/^@/, "");
}

/** Deep link that opens the Mini App from groups/channels (url buttons). */
export function telegramDeepLink(path?: string) {
  const username = botUsername();
  if (!path || path === "/") {
    return `https://t.me/${username}?startapp=home`;
  }

  const eventMatch = path.match(/^\/events\/([0-9a-f-]{36})$/i);
  if (eventMatch) {
    return `https://t.me/${username}?startapp=e_${eventMatch[1]}`;
  }

  const compact = path.replace(/^\//, "").replace(/\//g, "__").slice(0, 64);
  return `https://t.me/${username}?startapp=${compact}`;
}
