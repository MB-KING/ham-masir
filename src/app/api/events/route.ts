import { EventService } from "@/modules/events/event.service";
import { ok, fail } from "@/shared/api";
import { toPagination } from "@/shared/pagination";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const pagination = toPagination(searchParams);
    const events = await new EventService().listPublished(pagination.take, pagination.skip);
    return ok({ items: events, page: pagination.page, pageSize: pagination.pageSize });
  } catch (error) {
    return fail(error);
  }
}
