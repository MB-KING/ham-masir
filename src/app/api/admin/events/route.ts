import { Role } from "@prisma/client";
import { requireCurrentUser } from "@/modules/auth/session";
import { requireRole } from "@/modules/auth/authorization";
import { createEventSchema } from "@/modules/events/event.schema";
import { EventService } from "@/modules/events/event.service";
import { ok, fail, parseJson } from "@/shared/api";

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser();
    requireRole(user, [Role.ADMIN, Role.SUPER_ADMIN]);
    const input = await parseJson(request, createEventSchema);
    const event = await new EventService().createEvent(user.communityId, user.id, input);
    return ok(event, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}
