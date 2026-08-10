import { requireCurrentUser } from "@/modules/auth/session";
import { RewardService } from "@/modules/rewards/reward.service";
import { ok, fail } from "@/shared/api";

export async function POST(_request: Request, { params }: { params: Promise<{ rewardId: string }> }) {
  try {
    const user = await requireCurrentUser();
    const { rewardId } = await params;
    const redemption = await new RewardService().redeem(user.id, rewardId);
    return ok(redemption, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}
