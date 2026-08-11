import {
  CalendarClock,
  CheckCircle2,
  Gift,
  LockKeyhole,
  Store
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { RewardActions } from "@/components/user/reward-actions";
import { UserCard, UserPageHeader } from "@/components/user/user-card";
import { UserPageShell } from "@/components/user/user-shell";
import { prisma } from "@/lib/prisma";
import { getOptionalCurrentUser } from "@/modules/auth/session";
import {
  isRewardEligible,
  rewardEligibilityText
} from "@/shared/rewards";
import { errorMessagesFa, type ErrorCode } from "@/shared/errors";

export const dynamic = "force-dynamic";

export default async function RewardsPage({
  searchParams
}: {
  searchParams: Promise<{ received?: string; error?: string }>;
}) {
  const user = await getOptionalCurrentUser();
  const { received, error } = await searchParams;
  const errorText =
    error && error in errorMessagesFa
      ? errorMessagesFa[error as ErrorCode]
      : null;
  const now = new Date();
  const [rewards, attendanceCount] = await Promise.all([
    prisma.reward.findMany({
      where: {
        status: "APPROVED",
        startAt: { lte: now },
        expireAt: { gt: now },
        business: { status: "APPROVED", deletedAt: null }
      },
      orderBy: { expireAt: "asc" },
      include: {
        business: true,
        redemptions: user
          ? {
              where: {
                userId: user.id,
                status: { in: ["RESERVED", "REDEEMED"] }
              },
              select: { id: true }
            }
          : false
      }
    }),
    user
      ? prisma.attendance.count({
          where: { userId: user.id, status: "PRESENT" }
        })
      : Promise.resolve(0)
  ]);

  return (
    <UserPageShell>
      <UserPageHeader
        title="مزایا"
        subtitle="پیشنهادهای فعال کسب‌وکارها را با شرط روشن دریافت کن."
        backFallbackHref="/businesses"
      />
      {received ? (
        <UserCard className="mb-4 border-emerald-400/30 bg-emerald-500/10">
          <div className="flex items-start gap-3">
            <CheckCircle2
              className="mt-0.5 shrink-0 text-emerald-300"
              aria-hidden="true"
            />
            <div>
              <h2 className="font-black text-white">
                مزیت با موفقیت دریافت شد
              </h2>
              <p className="mt-1 text-sm leading-7 text-slate-300">
                اطلاعات آن در بخش «مزایای دریافت‌شده» پروفایل تو نگهداری می‌شود.
              </p>
            </div>
          </div>
        </UserCard>
      ) : null}
      {errorText ? (
        <UserCard className="mb-4 border-rose-400/30 bg-rose-500/10">
          <div className="flex items-start gap-3">
            <LockKeyhole
              className="mt-0.5 shrink-0 text-rose-300"
              aria-hidden="true"
            />
            <div>
              <h2 className="font-black text-white">دریافت مزیت انجام نشد</h2>
              <p className="mt-1 text-sm leading-7 text-slate-300">
                {errorText}
              </p>
            </div>
          </div>
        </UserCard>
      ) : null}
      {!user ? (
        <UserCard className="mb-4 border-sky-400/25 bg-sky-500/10">
          <p className="text-sm leading-7 text-sky-100">
            برای دریافت مزایا باید از داخل تلگرام وارد شوی.{" "}
            <Link
              href="/open-in-telegram"
              className="font-bold text-[#F59E0B] underline"
            >
              ورود از تلگرام
            </Link>
          </p>
        </UserCard>
      ) : null}
      <UserCard className="mb-4 border-[#F59E0B]/25 bg-[#0B1E43]">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F59E0B]/15 text-[#F59E0B]">
            <Gift size={20} aria-hidden="true" />
          </div>
          <div>
            <h2 className="font-black text-white">شرط هر مزیت روی کارت است</h2>
            <p className="mt-1 text-sm leading-7 text-slate-300">
              اگر شرط حضور، سطح یا گام را داشته باشی، می‌توانی همان لحظه
              دریافت کنی.
            </p>
          </div>
        </div>
      </UserCard>
      <div className="grid gap-3">
        {rewards.length === 0 ? (
          <UserCard className="py-10 text-center">
            <Gift
              className="mx-auto text-slate-500"
              size={32}
              aria-hidden="true"
            />
            <h2 className="mt-3 font-black text-white">
              فعلاً مزیت فعالی وجود ندارد
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              پیشنهادهای تأییدشده‌ی جدید همین‌جا نمایش داده می‌شوند.
            </p>
          </UserCard>
        ) : (
          rewards.map((reward) => {
            const redemptions = Array.isArray(reward.redemptions)
              ? reward.redemptions
              : [];
            const redeemed = redemptions.length > 0;
            const eligible = user
              ? isRewardEligible(reward, {
                  attendanceCount,
                  userLevel: user.level,
                  userXP: user.xp
                })
              : false;
            const reason = rewardEligibilityText(reward);
            return (
              <UserCard key={reward.id} className="flex h-full flex-col">
                {reward.image ? (
                  <Image
                    src={reward.image}
                    alt={reward.title}
                    width={800}
                    height={350}
                    className="mb-4 aspect-[16/7] w-full rounded-xl object-cover"
                  />
                ) : null}
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F59E0B]/15 text-[#F59E0B]">
                    <Gift size={21} aria-hidden="true" />
                  </div>
                  <div>
                    <h2 className="font-black text-white">{reward.title}</h2>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-[#F59E0B]">
                      <Store size={15} aria-hidden="true" />
                      {reward.business.name}
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  {reward.description}
                </p>
                <div className="mt-3 grid gap-2 text-xs text-slate-300">
                  <span
                    className={
                      eligible
                        ? "flex items-center gap-2 rounded-xl bg-white/[0.05] px-3 py-2"
                        : "flex items-center gap-2 rounded-xl bg-sky-400/10 px-3 py-2 text-sky-200"
                    }
                  >
                    <LockKeyhole
                      size={15}
                      className={eligible ? "text-[#F59E0B]" : "text-sky-300"}
                      aria-hidden="true"
                    />
                    {reason}
                  </span>
                  <span className="flex items-center gap-2 rounded-xl bg-white/[0.05] px-3 py-2">
                    <CalendarClock
                      size={15}
                      className="text-[#F59E0B]"
                      aria-hidden="true"
                    />
                    تا {new Intl.DateTimeFormat("fa-IR").format(reward.expireAt)}
                  </span>
                </div>
                <div className="mt-auto pt-4">
                  {user ? (
                    <RewardActions
                      rewardId={reward.id}
                      redeemed={redeemed}
                      disabled={!eligible}
                      reason={reason}
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
              </UserCard>
            );
          })
        )}
      </div>
    </UserPageShell>
  );
}
