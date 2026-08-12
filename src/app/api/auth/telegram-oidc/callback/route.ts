import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/modules/auth/auth.service";
import { safeInternalPath } from "@/lib/safe-internal-path";
import {
  applyTelegramSessionCookie,
  TELEGRAM_NEXT_COOKIE
} from "@/modules/auth/telegram-cookie";
import {
  TELEGRAM_OIDC_NONCE_COOKIE,
  TELEGRAM_OIDC_STATE_COOKIE,
  TELEGRAM_OIDC_VERIFIER_COOKIE,
  loginUserFromTelegramOidcCode,
  serializeTelegramOidcSession,
  telegramOidcAppOrigin,
  telegramOidcAbsoluteUrl,
  telegramOidcRedirectUri
} from "@/modules/auth/telegram-oidc";

function clearOidcCookies(response: NextResponse) {
  for (const name of [
    TELEGRAM_OIDC_STATE_COOKIE,
    TELEGRAM_OIDC_VERIFIER_COOKIE,
    TELEGRAM_OIDC_NONCE_COOKIE,
    TELEGRAM_NEXT_COOKIE
  ]) {
    response.cookies.set({ name, value: "", path: "/", maxAge: 0 });
  }
}

function failureRedirect(request: NextRequest, next: string) {
  const origin = telegramOidcAppOrigin(request);
  const failureUrl = telegramOidcAbsoluteUrl("/open-in-telegram", origin);
  failureUrl.searchParams.set("error", "UNAUTHORIZED");
  if (next !== "/") {
    failureUrl.searchParams.set("next", next);
  }
  const failure = NextResponse.redirect(failureUrl);
  clearOidcCookies(failure);
  return failure;
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const next = safeInternalPath(request.cookies.get(TELEGRAM_NEXT_COOKIE)?.value);

  if (params.get("error")) {
    return failureRedirect(request, next);
  }

  const code = params.get("code")?.trim();
  const state = params.get("state")?.trim();
  if (!code || !state) {
    return failureRedirect(request, next);
  }

  try {
    const origin = telegramOidcAppOrigin(request);
    const telegramUser = await loginUserFromTelegramOidcCode({
      code,
      state,
      expectedState: request.cookies.get(TELEGRAM_OIDC_STATE_COOKIE)?.value,
      redirectUri: telegramOidcRedirectUri(origin),
      codeVerifier: request.cookies.get(TELEGRAM_OIDC_VERIFIER_COOKIE)?.value,
      nonce: request.cookies.get(TELEGRAM_OIDC_NONCE_COOKIE)?.value
    });
    await new AuthService().loginWithTelegramUser(telegramUser);

    const response = NextResponse.redirect(
      telegramOidcAbsoluteUrl(next, origin)
    );
    applyTelegramSessionCookie(
      response.cookies,
      serializeTelegramOidcSession(telegramUser)
    );
    clearOidcCookies(response);
    return response;
  } catch {
    return failureRedirect(request, next);
  }
}
