import { createBusinessAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { UserCard, UserPageHeader } from "@/components/user/user-card";
import { UserPageShell } from "@/components/user/user-shell";

export default function NewBusinessPage() {
  return (
    <UserPageShell width="narrow">
      <UserPageHeader
        title="ثبت کسب‌وکار"
        subtitle="بعد از ثبت، درخواست برای تأیید به ادمین ارسال می‌شود."
      />
      <UserCard className="mb-4 border-[#F59E0B]/25 bg-[#0B1E43]">
        <h2 className="font-black text-white">چرا کسب‌وکارم را ثبت کنم؟</h2>
        <p className="mt-2 text-sm leading-7 text-slate-300">
          با ثبت کسب‌وکار، صفحه معرفی داخل هم مسیر می‌گیری و بعد از تأیید
          می‌توانی مزیت بگذاری. مزیت می‌تواند کوچک و کنترل‌شده باشد؛ مثلا تخفیف
          محدود، هدیه با ظرفیت کم یا کدی که فقط اعضای فعال دریافت می‌کنند.
        </p>
      </UserCard>
      <UserCard>
        <form action={createBusinessAction} className="grid gap-4">
          <Field
            name="name"
            label="نام کسب‌وکار"
            required
            minLength={2}
            placeholder="کافه هم‌قدم"
          />
          <label className="grid gap-2 text-sm font-bold text-slate-200">
            توضیحات
            <textarea
              name="description"
              required
              minLength={3}
              rows={5}
              className="rounded-xl border border-white/10 bg-[#061124] px-3 py-3 text-white outline-none focus:border-[#F59E0B]"
              placeholder="کوتاه بگو چه کاری انجام می‌دهی و چرا برای اعضای هم مسیر جذاب است."
            />
          </label>
          <Field
            name="website"
            label="وب‌سایت"
            type="url"
            placeholder="https://example.com"
          />
          <Field
            name="instagram"
            label="اینستاگرام"
            placeholder="@your_business"
          />
          <Button type="submit" className="w-full">
            ارسال برای تأیید
          </Button>
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
  minLength
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  minLength?: number;
}) {
  return (
    <label className="grid gap-2 text-sm font-bold text-slate-200">
      {label}
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        minLength={minLength}
        className="h-11 w-full rounded-xl border border-white/10 bg-[#061124] px-3 text-white outline-none focus:border-[#F59E0B]"
      />
    </label>
  );
}
