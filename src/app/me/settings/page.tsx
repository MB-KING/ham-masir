import { Eye, Save, ShieldCheck } from "lucide-react";
import { updateProfileAction } from "@/app/actions";
import { UserCard, UserPageHeader } from "@/components/user/user-card";
import { UserPageShell } from "@/components/user/user-shell";
import { prisma } from "@/lib/prisma";
import { requireCurrentUserPage } from "@/modules/auth/session";

export const dynamic = "force-dynamic";

export default async function ProfileSettingsPage() {
  const user = await requireCurrentUserPage();
  const profile = await prisma.userProfile.findUnique({
    where: { userId: user.id }
  });

  return (
    <UserPageShell width="narrow">
        <UserPageHeader
          title="تنظیمات پروفایل"
          subtitle="مشخص کن سایر اعضا چه اطلاعاتی از تو را در فهرست همراهان ببینند."
        />
        <UserCard className="mb-4 border-[#F59E0B]/25 bg-[#0B1E43]">
          <div className="flex items-start gap-3">
            <ShieldCheck
              className="mt-0.5 shrink-0 text-[#F59E0B]"
              aria-hidden="true"
            />
            <div>
              <h2 className="font-black text-white">حریم خصوصی دست خود توست</h2>
              <p className="mt-1 text-sm leading-7 text-slate-300">
                خاموش کردن نمایش در فهرست، پروفایل تو را برای سایر اعضا پنهان
                می‌کند؛ ادمین همچنان برای مدیریت برنامه‌ها به اطلاعات ضروری
                دسترسی دارد.
              </p>
            </div>
          </div>
        </UserCard>
        <UserCard>
          <form action={updateProfileAction} className="grid gap-5">
            <label className="grid gap-2 text-sm font-bold text-slate-200">
              درباره من
              <textarea
                name="bio"
                maxLength={400}
                rows={4}
                defaultValue={profile?.bio ?? ""}
                className="rounded-xl border border-white/10 bg-[#061124] px-3 py-3 text-white outline-none focus:border-[#F59E0B]"
                placeholder="مثلاً علاقه‌مند به پیاده‌روی شهری و آشنایی با آدم‌های تازه"
              />
              <span className="text-xs font-normal text-slate-500">
                حداکثر ۴۰۰ کاراکتر؛ این متن در فهرست همراهان نمایش داده می‌شود.
              </span>
            </label>
            <div className="grid gap-3">
              <Toggle
                name="showInMembersDirectory"
                label="نمایش من در فهرست همراهان"
                description="اگر خاموش باشد، پروفایل تو برای اعضای عادی نمایش داده نمی‌شود."
                defaultChecked={profile?.showInMembersDirectory ?? true}
              />
              <Toggle
                name="showTelegramUsername"
                label="نمایش نام کاربری تلگرام"
                description="اعضا بتوانند نام کاربری تلگرام تو را ببینند."
                defaultChecked={profile?.showTelegramUsername ?? true}
              />
              <Toggle
                name="showBusiness"
                label="نمایش کسب‌وکارهای من"
                description="کسب‌وکارهای تأییدشده‌ای که عضو آن‌ها هستی نمایش داده شوند."
                defaultChecked={profile?.showBusiness ?? true}
              />
              <Toggle
                name="showAttendanceCount"
                label="نمایش تعداد حضورها"
                description="تعداد حضورهای تأییدشده در پروفایل عمومی دیده شود."
                defaultChecked={profile?.showAttendanceCount ?? true}
              />
            </div>
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#F59E0B] px-5 text-sm font-black text-[#061124]"
            >
              <Save size={18} aria-hidden="true" />
              ذخیره تنظیمات
            </button>
          </form>
        </UserCard>
    </UserPageShell>
  );
}

function Toggle({
  name,
  label,
  description,
  defaultChecked
}: {
  name: string;
  label: string;
  description: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/[0.05] p-3">
      <input
        name={name}
        type="checkbox"
        defaultChecked={defaultChecked}
        className="mt-1 h-4 w-4 shrink-0 accent-[#F59E0B]"
      />
      <Eye
        size={18}
        className="mt-0.5 shrink-0 text-[#F59E0B]"
        aria-hidden="true"
      />
      <span>
        <span className="block text-sm font-bold text-white">{label}</span>
        <span className="mt-1 block text-xs leading-5 text-slate-400">
          {description}
        </span>
      </span>
    </label>
  );
}
