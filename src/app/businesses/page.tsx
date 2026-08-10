import { Store } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UserCard, UserPageHeader } from "@/components/user/user-card";
import {
  secondaryActionClass,
  UserPageShell
} from "@/components/user/user-shell";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function BusinessesPage() {
  const businesses = await prisma.business.findMany({
    where: { status: "APPROVED", deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      rewards: {
        where: {
          status: "APPROVED",
          startAt: { lte: new Date() },
          expireAt: { gt: new Date() }
        }
      }
    }
  });

  return (
    <UserPageShell>
      <UserPageHeader
        title="کسب‌وکارهای اعضا"
        subtitle="کسب‌وکارهایی که به جامعه هم مسیر وصل شده‌اند و برای اعضا پیشنهاد ویژه دارند."
      />

      <UserCard className="mb-4 border-[#F59E0B]/25 bg-[#0B1E43]">
        <h2 className="font-black text-white">این بخش برای چیست؟</h2>
        <p className="mt-2 text-sm leading-7 text-slate-300">
          اگر عضو هستی، اینجا کسب‌وکارهای قابل اعتماد جامعه را می‌بینی. اگر صاحب
          کسب‌وکار هستی، می‌توانی کارت را معرفی کنی و با یک مزیت محدود، اعضای
          فعال را به اولین تجربه با برندت دعوت کنی.
        </p>
      </UserCard>

      <div className="mb-4 flex flex-wrap gap-2">
        <Link href="/businesses/new">
          <Button>ثبت کسب‌وکار من</Button>
        </Link>
        <Link className={secondaryActionClass} href="/businesses/me">
          مدیریت کسب‌وکارهای من
        </Link>
      </div>

      <div className="grid gap-3">
        {businesses.length === 0 ? (
          <UserCard>
            <p className="text-sm text-slate-300">
              هنوز کسب‌وکار تأییدشده‌ای وجود ندارد.
            </p>
          </UserCard>
        ) : (
          businesses.map((business) => (
            <UserCard key={business.id}>
              <Store className="mb-3 text-[#F59E0B]" aria-hidden="true" />
              <h2 className="break-words font-black text-white">
                {business.name}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                {business.description}
              </p>
              <p className="mt-3 text-xs font-bold text-[#F59E0B]">
                {business.rewards.length} مزیت فعال
              </p>
              <Link
                className={`${secondaryActionClass} mt-4`}
                href={`/businesses/${business.id}` as `/businesses/${string}`}
              >
                دیدن کسب‌وکار
              </Link>
            </UserCard>
          ))
        )}
      </div>
    </UserPageShell>
  );
}
