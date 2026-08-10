import { BusinessStatus } from "@prisma/client";
import { notFound } from "next/navigation";
import { updateBusinessAction } from "@/app/admin/actions";
import { AdminCard, PageTitle } from "@/components/admin/admin-card";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminPage } from "@/modules/auth/admin-session";
import { businessStatusLabels, labelOf } from "@/shared/labels";

export default async function EditBusinessPage({ params }: { params: Promise<{ businessId: string }> }) {
  await requireSuperAdminPage();
  const { businessId } = await params;
  const business = await prisma.business.findUnique({ where: { id: businessId } });

  if (!business) {
    notFound();
  }

  return (
    <>
      <PageTitle
        showBack
        backFallbackHref="/admin/businesses"
        title="ویرایش کسب‌وکار"
        subtitle="سوپرادمین می‌تواند اطلاعات عمومی و وضعیت کسب‌وکار را اصلاح کند."
      />
      <AdminCard>
        <form action={updateBusinessAction} className="grid gap-4">
          <input type="hidden" name="businessId" value={business.id} />
          <Field label="نام کسب‌وکار" name="name" required defaultValue={business.name} />
          <Field label="وب‌سایت" name="website" defaultValue={business.website ?? ""} />
          <Field label="اینستاگرام" name="instagram" defaultValue={business.instagram ?? ""} />
          <label className="grid gap-2 text-sm font-bold text-slate-200">
            وضعیت
            <select name="status" defaultValue={business.status} className="h-11 rounded-xl border border-white/10 bg-[#061124] px-3 text-white outline-none focus:border-[#F59E0B]">
              {Object.values(BusinessStatus).map((status) => (
                <option key={status} value={status}>
                  {labelOf(businessStatusLabels, status)}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-bold text-slate-200">
            توضیحات
            <textarea name="description" rows={4} defaultValue={business.description ?? ""} className="rounded-xl border border-white/10 bg-[#061124] px-3 py-3 text-white outline-none focus:border-[#F59E0B]" />
          </label>
          <div>
            <button className="min-h-11 w-full rounded-xl bg-[#F59E0B] px-5 text-sm font-black text-[#061124]" type="submit">
              ذخیره تغییرات
            </button>
          </div>
        </form>
      </AdminCard>
    </>
  );
}

function Field({
  label,
  name,
  required,
  defaultValue,
  className
}: {
  label: string;
  name: string;
  required?: boolean;
  defaultValue?: string;
  className?: string;
}) {
  return (
    <label className={`grid gap-2 text-sm font-bold text-slate-200 ${className ?? ""}`}>
      {label}
      <input name={name} required={required} defaultValue={defaultValue} className="h-11 rounded-xl border border-white/10 bg-[#061124] px-3 text-white outline-none focus:border-[#F59E0B]" />
    </label>
  );
}
