import { requireCurrentUser } from "@/modules/auth/session";
import { RegistrationService } from "@/modules/registrations/registration.service";
import { ok, fail } from "@/shared/api";

export async function POST(_request: Request, { params }: { params: Promise<{ eventId: string }> }) {
  try {
    const user = await requireCurrentUser();
    const { eventId } = await params;
    const registration = await new RegistrationService().register(user.id, eventId);
    return ok(registration, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ eventId: string }> }) {
  try {
    const user = await requireCurrentUser();
    const { eventId } = await params;
    const registration = await new RegistrationService().cancel(user.id, eventId);
    return ok(registration);
  } catch (error) {
    return fail(error);
  }
}
