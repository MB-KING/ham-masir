import { RewardService } from "@/modules/rewards/reward.service";
import { ok, fail } from "@/shared/api";
import { toPagination } from "@/shared/pagination";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const pagination = toPagination(searchParams);
    const items = await new RewardService().listApproved(pagination.take, pagination.skip);
    return ok({ items, page: pagination.page, pageSize: pagination.pageSize });
  } catch (error) {
    return fail(error);
  }
}
