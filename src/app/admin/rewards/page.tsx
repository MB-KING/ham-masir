import { RewardStatus } from "@prisma/client";
import Link from "next/link";
import { setRewardStatusAction } from "@/app/admin/actions";
import { AdminCard, PageTitle } from "@/components/admin/admin-card";
import { StatusActionButton } from "@/components/admin/status-action-button";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminPage } from "@/modules/auth/admin-session";
import { labelOf, rewardStatusLabels, rewardTypeLabels } from "@/shared/labels";

const statusOptions = [
  {
    status: RewardStatus.APPROVED,
    label: "تأیید و انتشار",
    danger: false
  },
  {
    status: RewardStatus.REJECTED,
    label: "رد مزیت",
    danger: true,
    confirmMessage: "این مزیت رد شود؟"
  },
  {
    status: RewardStatus.DISABLED,
    label: "غیرفعال کردن",
    danger: true,
    confirmMessage: "این مزیت غیرفعال شود؟"
  },
  {
    status: RewardStatus.EXPIRED,
    label: "منقضی کردن",
    danger: true,
    confirmMessage: "این مزیت منقضی شود؟"
  }
] as const;

export default async function AdminRewardsPage() {
  await requireSuperAdminPage();
  const rewards = await prisma.reward.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      business: true,
      createdBy: true,
      _count: { select: { redemptions: true, codes: true } }
    }
  });

  return (
    <>
      <PageTitle
        title="بررسی مزایا"
        subtitle="مزیت‌ها قبل از نمایش عمومی باید تأیید شوند."
      />
      <details className="mb-4 rounded-xl border border-[#F59E0B]/25 bg-[#0B1E43] p-4">
        <summary className="cursor-pointer font-black text-white">
          چرا بررسی لازم است؟
        </summary>
        <p className="mt-2 text-sm leading-7 text-slate-300">
          بررسی ادمین کمک می‌کند متن واضح باشد، شرایط دریافت منصفانه باشد و چیزی
          که منتشر می‌شود به اعتبار جامعه آسیب نزند.
        </p>
      </details>
      <div className="grid gap-3">
        {rewards.length === 0 ? (
          <AdminCard>
            <p className="text-sm text-slate-300">هنوز مزیتی ثبت نشده است.</p>
          </AdminCard>
        ) : (
          rewards.map((reward) => {
            const creatorName =
              [reward.createdBy.firstName, reward.createdBy.lastName]
                .filter(Boolean)
                .join(" ") ||
              reward.createdBy.username ||
              reward.createdBy.telegramId.toString();

            return (
              <AdminCard key={reward.id}>
                <h2 className="font-black text-white">{reward.title}</h2>
                <p className="mt-1 text-sm text-slate-400">
                  {reward.business.name}، ثبت‌کننده: {creatorName}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {reward.description}
                </p>
                <p className="mt-2 text-xs font-bold text-[#F59E0B]">
                  {labelOf(rewardStatusLabels, reward.status)}،{" "}
                  {labelOf(rewardTypeLabels, reward.type)}، {reward._count.codes}{" "}
                  کد، {reward._count.redemptions} دریافت
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  سطح {reward.minimumLevel ?? "آزاد"}، حضور{" "}
                  {reward.minimumAttendance ?? "آزاد"}، گام{" "}
                  {reward.requiredXP ?? "آزاد"}، سقف هر عضو{" "}
                  {reward.perUserLimit ?? "بدون محدودیت"}
                </p>
                <div className="mt-4 grid gap-2">
                  <Link
                    className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/15 px-3 text-sm font-bold text-slate-200"
                    href={`/admin/rewards/${reward.id}/edit`}
                  >
                    ویرایش
                  </Link>
                  {statusOptions.map((option) => (
                    <form key={option.status} action={setRewardStatusAction}>
                      <input
                        type="hidden"
                        name="rewardId"
                        value={reward.id}
                      />
                      <input
                        type="hidden"
                        name="status"
                        value={option.status}
                      />
                      <StatusActionButton
                        label={option.label}
                        danger={option.danger}
                        confirmMessage={
                          "confirmMessage" in option
                            ? option.confirmMessage
                            : undefined
                        }
                      />
                    </form>
                  ))}
                </div>
              </AdminCard>
            );
          })
        )}
      </div>
    </>
  );
}
