import { NextRequest, NextResponse } from "next/server";
import { safeInternalPath } from "@/lib/safe-internal-path";
import { TELEGRAM_NEXT_COOKIE } from "@/modules/auth/telegram-cookie";
import {
  TELEGRAM_OIDC_NONCE_COOKIE,
  TELEGRAM_OIDC_STATE_COOKIE,
  TELEGRAM_OIDC_VERIFIER_COOKIE,
  buildTelegramOidcAuthUrl,
  createOidcState,
  createPkcePair,
  requireTelegramOidcCredentials,
  telegramOidcAppOrigin,
  telegramOidcAbsoluteUrl,
  telegramOidcFlowCookieOptions,
  telegramOidcRedirectUri
} from "@/modules/auth/telegram-oidc";

function failureRedirect(request: NextRequest, next: string) {
  const origin = telegramOidcAppOrigin(request);
  const failureUrl = telegramOidcAbsoluteUrl("/open-in-telegram", origin);
  failureUrl.searchParams.set("error", "UNAUTHORIZED");
  if (next !== "/") {
    failureUrl.searchParams.set("next", next);
  }
  return NextResponse.redirect(failureUrl);
}

export async function GET(request: NextRequest) {
  const next = safeInternalPath(request.nextUrl.searchParams.get("next"));

  try {
    const { clientId } = requireTelegramOidcCredentials();
    const origin = telegramOidcAppOrigin(request);
    const redirectUri = telegramOidcRedirectUri(origin);
    const { verifier, challenge } = createPkcePair();
    const state = createOidcState();
    const nonce = createOidcState();
    const authUrl = buildTelegramOidcAuthUrl({
      clientId,
      redirectUri,
      state,
      challenge,
      nonce
    });

    const response = NextResponse.redirect(authUrl);
    const cookie = telegramOidcFlowCookieOptions();
    response.cookies.set({
      name: TELEGRAM_OIDC_STATE_COOKIE,
      value: state,
      ...cookie
    });
    response.cookies.set({
      name: TELEGRAM_OIDC_VERIFIER_COOKIE,
      value: verifier,
      ...cookie
    });
    response.cookies.set({
      name: TELEGRAM_OIDC_NONCE_COOKIE,
      value: nonce,
      ...cookie
    });
    response.cookies.set({
      name: TELEGRAM_NEXT_COOKIE,
      value: next,
      ...cookie
    });
    return response;
  } catch {
    return failureRedirect(request, next);
  }
}
