import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AuthService } from "@/modules/auth/auth.service";
import { safeInternalPath } from "@/lib/safe-internal-path";
import {
  applyTelegramSessionCookie,
  TELEGRAM_NEXT_COOKIE
} from "@/modules/auth/telegram-cookie";
import {
  serializeTelegramLoginWidget
} from "@/modules/auth/telegram-login";
import { fail, ok, parseJson } from "@/shared/api";

const widgetSchema = z
  .object({
    id: z.coerce.number().int().positive(),
    first_name: z.string().min(1),
    last_name: z.string().optional(),
    username: z.string().optional(),
    photo_url: z.string().optional(),
    auth_date: z.coerce.number().int().positive(),
    hash: z.string().min(32)
  })
  .passthrough();

function userResponse(user: {
  id: string;
  telegramId: bigint;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  roles: { role: string }[];
}) {
  return {
    id: user.id,
    telegramId: user.telegramId.toString(),
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    roles: user.roles.map((role) => role.role)
  };
}

export async function POST(request: Request) {
  try {
    const input = await parseJson(request, widgetSchema);
    const user = await new AuthService().loginWithTelegramWidget(input);
    const response = ok(userResponse(user));
    applyTelegramSessionCookie(
      response.cookies,
      serializeTelegramLoginWidget(input)
    );
    return response;
  } catch (error) {
    return fail(error);
  }
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  if (params.has("code") || params.has("error")) {
    const oidcUrl = new URL("/api/auth/telegram-oidc/callback", request.url);
    for (const [key, value] of params.entries()) {
      oidcUrl.searchParams.set(key, value);
    }
    return NextResponse.redirect(oidcUrl);
  }

  const next = safeInternalPath(
    params.get("next") ?? request.cookies.get(TELEGRAM_NEXT_COOKIE)?.value
  );

  try {
    const input = Object.fromEntries(params.entries());
    await new AuthService().loginWithTelegramWidget(input);

    const response = NextResponse.redirect(new URL(next, request.url));
    applyTelegramSessionCookie(
      response.cookies,
      serializeTelegramLoginWidget(input)
    );
    response.cookies.set({
      name: TELEGRAM_NEXT_COOKIE,
      value: "",
      path: "/",
      maxAge: 0
    });
    return response;
  } catch {
    const failureUrl = new URL("/open-in-telegram", request.url);
    failureUrl.searchParams.set("error", "UNAUTHORIZED");
    if (next !== "/") {
      failureUrl.searchParams.set("next", next);
    }
    const failure = NextResponse.redirect(failureUrl);
    failure.cookies.set({
      name: TELEGRAM_NEXT_COOKIE,
      value: "",
      path: "/",
      maxAge: 0
    });
    return failure;
  }
}