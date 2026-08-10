import { EventService } from "@/modules/events/event.service";
import { ok, fail } from "@/shared/api";

export async function GET(_request: Request, { params }: { params: Promise<{ eventId: string }> }) {
  try {
    const { eventId } = await params;
    const event = await new EventService().getPublicEvent(eventId);
    return ok(event);
  } catch (error) {
    return fail(error);
  }
}
