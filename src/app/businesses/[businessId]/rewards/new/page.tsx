import { RewardType } from "@prisma/client";
import { notFound } from "next/navigation";
import { createRewardAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { UserCard, UserPageHeader } from "@/components/user/user-card";
import { UserPageShell } from "@/components/user/user-shell";
import { prisma } from "@/lib/prisma";
import { requireCurrentUserPage } from "@/modules/auth/session";

export const dynamic = "force-dynamic";

export default async function NewRewardPage({ params }: { params: Promise<{ businessId: string }> }) {
  const user = await requireCurrentUserPage();
  const { businessId } = await params;
  const business = await prisma.business.findFirst({
    where: { id: businessId, status: "APPROVED", members: { some: { userId: user.id } } }
  });

  if (!business) {
    notFound();
  }

  const today = new Date().toISOString().slice(0, 10);
  const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  return (
    <UserPageShell width="narrow">
        <UserPageHeader title="ثبت مزیت برای اعضا" subtitle={`برای ${business.name}. بعد از ارسال، ادمین مزیت را بررسی و منتشر می‌کند.`} />
        <UserCard className="mb-4 border-[#F59E0B]/25 bg-[#0B1E43]">
          <h2 className="font-black text-white">مزیت یعنی چه؟</h2>
          <p className="mt-2 text-sm leading-7 text-slate-300">
            مزیت یک پیشنهاد مخصوص اعضای هم مسیر است؛ می‌تواند تخفیف، هدیه کوچک، سرویس ویژه یا یک کد اختصاصی باشد. هدفش این نیست که بی‌دلیل چیزی رایگان بدهی؛ هدف این است که اعضای فعال با کسب‌وکارت آشنا شوند، اولین خرید راحت‌تر اتفاق بیفتد و رابطه خوبی با جامعه هم مسیر بسازی.
          </p>
          <p className="mt-2 text-sm leading-7 text-slate-300">
            اگر نمی‌خواهی چیزی رایگان باشد، می‌توانی یک تخفیف محدود، ظرفیت کم، تاریخ انقضا، حداقل حضور یا سقف دریافت برای هر عضو بگذاری.
          </p>
        </UserCard>
        <UserCard>
          <form action={createRewardAction} className="grid gap-4">
            <input type="hidden" name="businessId" value={business.id} />
            <Field name="title" label="عنوان مزیت" required minLength={3} placeholder="مثلا ۱۵٪ تخفیف سفارش" />
            <label className="grid gap-2 text-sm font-bold text-slate-200">
              نوع مزیت
              <select name="type" defaultValue={RewardType.DISCOUNT} className="h-11 rounded-xl border border-white/10 bg-[#061124] px-3 text-white outline-none focus:border-[#F59E0B]">
                <option value={RewardType.DISCOUNT}>تخفیف</option>
                <option value={RewardType.FREE_ITEM}>هدیه رایگان</option>
                <option value={RewardType.SERVICE}>خدمت ویژه</option>
                <option value={RewardType.OTHER}>سایر</option>
              </select>
            </label>
            <Field name="discountValue" label="مقدار یا ارزش مزیت" placeholder="مثلا 15٪ یا یک نوشیدنی رایگان" />
            <Field name="startAt" label="شروع اعتبار" type="date" required defaultValue={today} />
            <Field name="expireAt" label="پایان اعتبار" type="date" required defaultValue={nextMonth} />
            <Field name="minimumAttendance" label="حداقل حضور لازم" type="number" placeholder="1" />
            <Field name="minimumLevel" label="حداقل سطح عضو" type="number" placeholder="2" />
            <Field name="requiredXP" label="هزینه گام" type="number" placeholder="20" />
            <Field name="usageLimit" label="ظرفیت کل مزیت" type="number" placeholder="50" />
            <Field name="perUserLimit" label="سقف دریافت هر عضو" type="number" placeholder="1" defaultValue="1" />
            <Field name="discountCode" label="کد عمومی" placeholder="HAMMASIR15" />
            <Field name="image" label="آدرس تصویر مزیت" type="url" placeholder="https://example.com/reward.jpg" />
            <label className="grid gap-2 text-sm font-bold text-slate-200">
              توضیحات استفاده
              <textarea
                name="description"
                required
                minLength={3}
                rows={4}
                className="rounded-xl border border-white/10 bg-[#061124] px-3 py-3 text-white outline-none focus:border-[#F59E0B]"
                placeholder="شرایط استفاده از مزیت را کوتاه، روشن و بدون ابهام بنویس."
              />
            </label>
            <label className="grid gap-2 text-sm font-bold text-slate-200">
              کدهای اختصاصی، هر خط یک کد
              <textarea name="codes" rows={5} className="rounded-xl border border-white/10 bg-[#061124] px-3 py-3 font-mono text-sm text-white outline-none focus:border-[#F59E0B]" placeholder={"CODE-001\nCODE-002"} />
            </label>
            <div>
              <Button
                className="w-full"
                type="submit"
                pendingLabel="در حال ثبت…"
              >
                ارسال برای تأیید
              </Button>
            </div>
          </form>
        </UserCard>
    </UserPageShell>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
  defaultValue,
  minLength,
  className
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
  minLength?: number;
  className?: string;
}) {
  return (
    <label className={`grid gap-2 text-sm font-bold text-slate-200 ${className ?? ""}`}>
      {label}
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue}
        minLength={minLength}
        className="h-11 w-full rounded-xl border border-white/10 bg-[#061124] px-3 text-white outline-none focus:border-[#F59E0B]"
      />
    </label>
  );
}
