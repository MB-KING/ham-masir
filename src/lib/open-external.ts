type TelegramWebAppLite = {
  openLink?: (url: string, options?: { try_instant_view?: boolean }) => void;
};

/**
 * Open an HTTPS URL outside the Mini App WebView.
 * Custom schemes (neshan://, waze://, …) are blocked or error in Telegram.
 */
type TelegramWebAppShare = TelegramWebAppLite & {
  openTelegramLink?: (url: string) => void;
  shareMessage?: (msgId: string, callback?: (sent: boolean) => void) => void;
};

export function openExternalHttps(url: string) {
  if (typeof window === "undefined") return;

  const tg = (
    window as unknown as { Telegram?: { WebApp?: TelegramWebAppShare } }
  ).Telegram?.WebApp;

  if (tg?.openLink && /^https?:\/\//i.test(url)) {
    tg.openLink(url, { try_instant_view: false });
    return;
  }

  const opened = window.open(url, "_blank", "noopener,noreferrer");
  if (!opened) {
    window.location.assign(url);
  }
}

export function openTelegramShare(url: string) {
  if (typeof window === "undefined") return;
  const tg = (
    window as unknown as { Telegram?: { WebApp?: TelegramWebAppShare } }
  ).Telegram?.WebApp;
  if (tg?.openTelegramLink && url.startsWith("https://t.me/")) {
    tg.openTelegramLink(url);
    return;
  }
  openExternalHttps(url);
}

export function canShareTelegramMessage() {
  if (typeof window === "undefined") return false;
  const tg = (
    window as unknown as { Telegram?: { WebApp?: TelegramWebAppShare } }
  ).Telegram?.WebApp;
  return typeof tg?.shareMessage === "function";
}

export function shareTelegramPreparedMessage(preparedId: string) {
  return new Promise<boolean>((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }
    const tg = (
      window as unknown as { Telegram?: { WebApp?: TelegramWebAppShare } }
    ).Telegram?.WebApp;
    if (!tg?.shareMessage) {
      resolve(false);
      return;
    }
    try {
      tg.shareMessage(preparedId, (sent) => resolve(Boolean(sent)));
    } catch {
      resolve(false);
    }
  });
}
