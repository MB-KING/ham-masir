import { redeemRewardAction } from "@/app/actions";
import { CheckCircle2, LockKeyhole, TicketCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RewardActions({
  rewardId,
  disabled,
  redeemed,
  reason
}: {
  rewardId: string;
  disabled?: boolean;
  redeemed?: boolean;
  reason?: string;
}) {
  if (redeemed) {
    return (
      <div className="grid gap-2">
        <Button className="w-full" disabled>
          <CheckCircle2 size={17} aria-hidden="true" />
          دریافت شده
        </Button>
        <p className="text-xs leading-6 text-slate-400">
          این مزیت به پروفایل تو اضافه شده است.
        </p>
      </div>
    );
  }

  if (disabled) {
    return (
      <div className="grid gap-2">
        <Button className="w-full" disabled>
          <LockKeyhole size={17} aria-hidden="true" />
          هنوز قفل است
        </Button>
        {reason ? (
          <p className="text-xs leading-6 text-slate-400">{reason}</p>
        ) : null}
      </div>
    );
  }

  return (
    <form action={redeemRewardAction}>
      <input type="hidden" name="rewardId" value={rewardId} />
      <Button className="w-full" type="submit">
        <TicketCheck size={17} aria-hidden="true" />
        دریافت این مزیت
      </Button>
    </form>
  );
}
