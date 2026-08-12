export const TELEGRAM_INIT_COOKIE = "hm_tg_init";
export const TELEGRAM_INIT_HEADER = "x-telegram-init-data";
export const TELEGRAM_NEXT_COOKIE = "hm_tg_next";

const SESSION_MAX_AGE = 60 * 60 * 24;

export function telegramSessionCookieOptions() {
  return {
    httpOnly: true as const,
    // Local http://localhost cannot set Secure cookies in browsers.
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE
  };
}

export function applyTelegramSessionCookie(
  cookies: { set: (options: { name: string; value: string } & Record<string, unknown>) => void },
  value: string
) {
  cookies.set({
    name: TELEGRAM_INIT_COOKIE,
    value,
    ...telegramSessionCookieOptions()
  });
}
