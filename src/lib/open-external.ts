type TelegramWebAppLite = {
  openLink?: (url: string, options?: { try_instant_view?: boolean }) => void;
};

/**
 * Open an HTTPS URL outside the Mini App WebView.
 * Custom schemes (neshan://, waze://, …) are blocked or error in Telegram.
 */
export function openExternalHttps(url: string) {
  if (typeof window === "undefined") return;

  const tg = (window as unknown as { Telegram?: { WebApp?: TelegramWebAppLite } })
    .Telegram?.WebApp;

  if (tg?.openLink && /^https?:\/\//i.test(url)) {
    tg.openLink(url, { try_instant_view: false });
    return;
  }

  const opened = window.open(url, "_blank", "noopener,noreferrer");
  if (!opened) {
    window.location.assign(url);
  }
}
