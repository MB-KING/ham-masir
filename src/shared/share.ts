export function eventShareText(eventTitle: string) {
  return `من توی برنامه «${eventTitle}» شرکت می‌کنم. اگر شما هم هستید خوشحال می‌شم ببینمتون 🥾`;
}

export function telegramShareUrl(url: string, text: string) {
  const share = new URL("https://t.me/share/url");
  share.searchParams.set("url", url);
  share.searchParams.set("text", text);
  return share.toString();
}

export function twitterShareUrl(url: string, text: string) {
  const share = new URL("https://twitter.com/intent/tweet");
  share.searchParams.set("text", `${text}\n${url}`);
  return share.toString();
}

export function linkedinShareUrl(url: string) {
  const share = new URL("https://www.linkedin.com/sharing/share-offsite/");
  share.searchParams.set("url", url);
  return share.toString();
}

export function publicAppUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    "https://hammasir.mbking.info"
  ).replace(/\/$/, "");
}

export function eventReferralUrl(eventId: string, referrerId?: string | null) {
  const url = new URL(`${publicAppUrl()}/events/${eventId}`);
  if (referrerId) url.searchParams.set("ref", referrerId);
  return url.toString();
}
