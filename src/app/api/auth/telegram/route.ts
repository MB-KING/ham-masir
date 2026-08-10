import { AuthService } from "@/modules/auth/auth.service";
import { ok, fail, parseJson } from "@/shared/api";
import { z } from "zod";

const schema = z.object({
  initData: z.string().min(20)
});

export async function POST(request: Request) {
  try {
    const input = await parseJson(request, schema);
    const user = await new AuthService().loginWithTelegram(input.initData);
    return ok({
      id: user.id,
      telegramId: user.telegramId.toString(),
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      roles: user.roles.map((role) => role.role)
    });
  } catch (error) {
    return fail(error);
  }
}
