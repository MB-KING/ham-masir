import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UserCard, UserPageHeader } from "@/components/user/user-card";
import {
  secondaryActionClass,
  UserPageShell
} from "@/components/user/user-shell";
import { prisma } from "@/lib/prisma";
import { requireCurrentUserPage } from "@/modules/auth/session";
import { businessStatusLabels, labelOf } from "@/shared/labels";

export const dynamic = "force-dynamic";

export default async function MyBusinessesPage() {
  const user = await requireCurrentUserPage();
  const businesses = await prisma.business.findMany({
    where: { members: { some: { userId: user.id } }, deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: { rewards: true }
  });

  return (
    <UserPageShell>
      <UserPageHeader
        title="کسب‌وکارهای من"
        subtitle="درخواست‌های ثبت‌شده و مزیت‌هایی که برای اعضا گذاشته‌ای اینجا مدیریت می‌شوند."
        backFallbackHref="/businesses"
      />
      <div className="mb-4">
        <Link href="/businesses/new">
          <Button>ثبت کسب‌وکار جدید</Button>
        </Link>
      </div>
      <div className="grid gap-3">
        {businesses.length === 0 ? (
          <UserCard>
            <p className="text-sm leading-6 text-slate-300">
              هنوز کسب‌وکاری ثبت نکرده‌ای. اگر صاحب کسب‌وکار هستی، آن را ثبت کن
              تا بعد از تأیید ادمین بتوانی برای اعضای هم مسیر مزیت بگذاری.
            </p>
          </UserCard>
        ) : (
          businesses.map((business) => (
            <UserCard key={business.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h2 className="break-words font-black text-white">
                    {business.name}
                  </h2>
                  <p className="mt-2 text-sm text-slate-300">
                    {business.description}
                  </p>
                  <p className="mt-2 text-xs font-bold text-[#F59E0B]">
                    {labelOf(businessStatusLabels, business.status)}،{" "}
                    {business.rewards.length} مزیت ثبت‌شده
                  </p>
                  {business.status === "PENDING" ? (
                    <p className="mt-2 text-xs text-slate-400">
                      بعد از تأیید ادمین، امکان ثبت مزیت فعال می‌شود.
                    </p>
                  ) : null}
                </div>
                <div className="flex w-full flex-wrap gap-2">
                  <Link
                    className={`${secondaryActionClass} flex-1`}
                    href={`/businesses/${business.id}` as `/businesses/${string}`}
                  >
                    مشاهده جزئیات
                  </Link>
                  {business.status === "APPROVED" ? (
                    <Link
                      className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-[#F59E0B] px-4 text-sm font-black text-[#061124]"
                      href={
                        `/businesses/${business.id}/rewards/new` as `/businesses/${string}/rewards/new`
                      }
                    >
                      ثبت مزیت
                    </Link>
                  ) : null}
                </div>
              </div>
            </UserCard>
          ))
        )}
      </div>
    </UserPageShell>
  );
}
