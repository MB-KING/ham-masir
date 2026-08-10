import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { RewardActions } from "@/components/user/reward-actions";
import { UserCard, UserPageHeader } from "@/components/user/user-card";
import { UserPageShell } from "@/components/user/user-shell";
import { prisma } from "@/lib/prisma";
import { getOptionalCurrentUser } from "@/modules/auth/session";
import {
  businessStatusLabels,
  labelOf,
  rewardStatusLabels
} from "@/shared/labels";

export const dynamic = "force-dynamic";

export default async function BusinessDetailsPage({
  params
}: {
  params: Promise<{ businessId: string }>;
}) {
  const user = await getOptionalCurrentUser();
  const { businessId } = await params;
  const [business, attendanceCount] = await Promise.all([
    prisma.business.findFirst({
      where: { id: businessId, deletedAt: null },
      include: {
        members: true,
        rewards: {
          orderBy: { createdAt: "desc" },
          include: {
            _count: { select: { redemptions: true, codes: true } }
          }
        }
      }
    }),
    user
      ? prisma.attendance.count({
          where: { userId: user.id, status: "PRESENT" }
        })
      : Promise.resolve(0)
  ]);

  if (!business) {
    notFound();
  }

  const isOwner = user
    ? business.members.some((member) => member.userId === user.id)
    : false;
  const now = new Date();
  const visibleRewards = isOwner
    ? business.rewards
    : business.rewards.filter(
        (reward) =>
          reward.status === "APPROVED" &&
          reward.startAt <= now &&
          reward.expireAt > now
      );

  return (
    <UserPageShell>
      <UserPageHeader
        title={business.name}
        subtitle={business.description ?? "کسب‌وکار عضو هم مسیر"}
      />
      <UserCard>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0 flex-1 text-sm leading-7 text-slate-300">
            <p>
              وضعیت:{" "}
              <span className="font-bold text-[#F59E0B]">
                {labelOf(businessStatusLabels, business.status)}
              </span>
            </p>
            {business.website ? (
              <p className="break-all">وب سایت: {business.website}</p>
            ) : null}
            {business.instagram ? (
              <p className="break-all" dir="ltr">
                اینستاگرام: {business.instagram}
              </p>
            ) : null}
          </div>
          {isOwner && business.status === "APPROVED" ? (
            <Link
              href={
                `/businesses/${business.id}/rewards/new` as `/businesses/${string}/rewards/new`
              }
            >
              <Button className="w-full">ثبت مزیت برای اعضا</Button>
            </Link>
          ) : null}
        </div>
      </UserCard>

      <h2 className="mb-3 mt-5 text-xl font-black text-white">مزایا</h2>
      <div className="grid gap-3">
        {visibleRewards.length === 0 ? (
          <UserCard>
            <p className="text-sm text-slate-300">
              {isOwner
                ? "هنوز مزیتی ثبت نکرده‌ای."
                : "فعلا مزیت فعالی برای این کسب‌وکار وجود ندارد."}
            </p>
          </UserCard>
        ) : (
          visibleRewards.map((reward) => (
            <UserCard key={reward.id}>
              <h3 className="break-words font-black text-white">
                {reward.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                {reward.description}
              </p>
              {isOwner ? (
                <p className="mt-3 text-xs font-bold text-[#F59E0B]">
                  {labelOf(rewardStatusLabels, reward.status)}
                </p>
              ) : null}
              {reward.status === "APPROVED" ? (
                <div className="mt-4">
                  {user ? (
                    <RewardActions
                      rewardId={reward.id}
                      disabled={
                        !isRewardEligible(reward, {
                          attendanceCount,
                          userLevel: user.level,
                          userXP: user.xp
                        })
                      }
                      reason="هنوز شرط لازم برای دریافت این مزیت را نداری."
                    />
                  ) : (
                    <Link
                      href="/open-in-telegram"
                      className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-[#F59E0B] px-4 text-sm font-black text-[#061124]"
                    >
                      ورود از تلگرام برای دریافت
                    </Link>
                  )}
                </div>
              ) : null}
            </UserCard>
          ))
        )}
      </div>
    </UserPageShell>
  );
}

function isRewardEligible(
  reward: {
    minimumAttendance: number | null;
    minimumLevel: number | null;
    requiredXP: number | null;
  },
  stats: { attendanceCount: number; userLevel: number; userXP: number }
) {
  return (
    (!reward.minimumAttendance ||
      stats.attendanceCount >= reward.minimumAttendance) &&
    (!reward.minimumLevel || stats.userLevel >= reward.minimumLevel) &&
    (!reward.requiredXP || stats.userXP >= reward.requiredXP)
  );
}
