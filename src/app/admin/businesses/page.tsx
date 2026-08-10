import { BusinessStatus } from "@prisma/client";
import Link from "next/link";
import { setBusinessStatusAction } from "@/app/admin/actions";
import { AdminCard, PageTitle } from "@/components/admin/admin-card";
import { StatusActionButton } from "@/components/admin/status-action-button";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminPage } from "@/modules/auth/admin-session";
import { businessStatusLabels, labelOf } from "@/shared/labels";

const statusOptions = [
  {
    status: BusinessStatus.APPROVED,
    label: "تأیید کسب‌وکار",
    danger: false
  },
  {
    status: BusinessStatus.REJECTED,
    label: "رد درخواست",
    danger: true,
    confirmMessage: "این درخواست رد شود؟"
  },
  {
    status: BusinessStatus.DISABLED,
    label: "غیرفعال کردن",
    danger: true,
    confirmMessage: "این کسب‌وکار غیرفعال شود؟"
  }
] as const;

export default async function AdminBusinessesPage() {
  await requireSuperAdminPage();
  const businesses = await prisma.business.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      rewards: true,
      members: { include: { user: true } }
    }
  });

  return (
    <>
      <PageTitle
        title="بررسی کسب‌وکارها"
        subtitle="فقط کسب‌وکارهای تأییدشده می‌توانند مزیت عمومی ثبت کنند."
      />
      <details className="mb-4 rounded-xl border border-[#F59E0B]/25 bg-[#0B1E43] p-4">
        <summary className="cursor-pointer font-black text-white">
          چرا تأیید لازم است؟
        </summary>
        <p className="mt-2 text-sm leading-7 text-slate-300">
          تأیید یعنی کسب‌وکار برای نمایش مناسب است و مالک مشخص شده. بعد از تأیید،
          مالک می‌تواند مزیت پیشنهاد کند؛ مزیت تا تأیید ادمین عمومی نمی‌شود.
        </p>
      </details>
      <div className="grid gap-3">
        {businesses.length === 0 ? (
          <AdminCard>
            <p className="text-sm text-slate-300">
              هنوز کسب‌وکاری ثبت نشده است.
            </p>
          </AdminCard>
        ) : (
          businesses.map((business) => {
            const owner = business.members[0]?.user;
            const ownerName = owner
              ? [owner.firstName, owner.lastName].filter(Boolean).join(" ") ||
                owner.username ||
                owner.telegramId.toString()
              : "مالک نامشخص";

            return (
              <AdminCard key={business.id}>
                <h2 className="font-black text-white">{business.name}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {business.description ??
                    "توضیحی برای این کسب‌وکار ثبت نشده است."}
                </p>
                <p className="mt-2 text-xs font-bold text-[#F59E0B]">
                  {labelOf(businessStatusLabels, business.status)}، مالک:{" "}
                  {ownerName}، {business.rewards.length} مزیت
                </p>
                {business.website ? (
                  <p className="mt-1 text-xs text-slate-400">
                    وب‌سایت: {business.website}
                  </p>
                ) : null}
                {business.instagram ? (
                  <p className="mt-1 text-xs text-slate-400">
                    اینستاگرام: {business.instagram}
                  </p>
                ) : null}
                <div className="mt-4 grid gap-2">
                  <Link
                    className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/15 px-3 text-sm font-bold text-slate-200"
                    href={`/admin/businesses/${business.id}/edit`}
                  >
                    ویرایش
                  </Link>
                  {statusOptions.map((option) => (
                    <form key={option.status} action={setBusinessStatusAction}>
                      <input
                        type="hidden"
                        name="businessId"
                        value={business.id}
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
