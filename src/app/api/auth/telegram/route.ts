import { AuthService } from "@/modules/auth/auth.service";
import { TELEGRAM_INIT_COOKIE } from "@/modules/auth/telegram-cookie";
import { ok, fail, parseJson } from "@/shared/api";
import { z } from "zod";

const schema = z.object({
  initData: z.string().min(20)
});

export async function POST(request: Request) {
  try {
    const input = await parseJson(request, schema);
    const user = await new AuthService().loginWithTelegram(input.initData);

    const response = ok({
      id: user.id,
      telegramId: user.telegramId.toString(),
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      roles: user.roles.map((role) => role.role)
    });

    response.cookies.set({
      name: TELEGRAM_INIT_COOKIE,
      value: input.initData,
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24
    });

    return response;
  } catch (error) {
    return fail(error);
  }
}
