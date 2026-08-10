import { Gauge, Save, Settings } from "lucide-react";
import { updateCommunityAction, upsertLevelAction } from "@/app/admin/actions";
import { AdminCard, PageTitle } from "@/components/admin/admin-card";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminPage } from "@/modules/auth/admin-session";

export default async function AdminSettingsPage() {
  const admin = await requireSuperAdminPage();
  const [community, levels] = await Promise.all([
    prisma.community.findUnique({ where: { id: admin.communityId } }),
    prisma.level.findMany({
      where: { communityId: admin.communityId },
      orderBy: { level: "asc" }
    })
  ]);
  if (!community) return null;

  return (
    <>
      <PageTitle
        title="تنظیمات جامعه و سطح‌ها"
        subtitle="نام و وضعیت جامعه را مدیریت کن و مشخص کن اعضا با چه میزان امتیاز به هر سطح برسند."
      />
      <AdminCard className="mb-5">
        <div className="mb-4 flex items-center gap-2">
          <Settings className="text-[#F59E0B]" size={20} />
          <h2 className="font-black text-white">مشخصات جامعه</h2>
        </div>
        <form
          action={updateCommunityAction}
          className="grid gap-4"
        >
          <Field
            name="name"
            label="نام جامعه"
            defaultValue={community.name}
            required
          />
          <Field
            name="tagline"
            label="شعار کوتاه"
            defaultValue={community.tagline ?? ""}
          />
          <label className="flex items-center gap-2 text-sm font-bold text-slate-200">
            <input
              name="isActive"
              type="checkbox"
              defaultChecked={community.isActive}
              className="h-4 w-4 accent-[#F59E0B]"
            />
            جامعه فعال باشد
          </label>
          <div>
            <button
              type="submit"
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#F59E0B] px-5 text-sm font-black text-[#061124]"
            >
              <Save size={17} />
              ذخیره تنظیمات
            </button>
          </div>
        </form>
      </AdminCard>

      <AdminCard className="mb-4 border-[#F59E0B]/25 bg-[#0B1E43]">
        <div className="flex items-start gap-3">
          <Gauge className="mt-0.5 shrink-0 text-[#F59E0B]" />
          <div>
            <h2 className="font-black text-white">
              سطح‌ها چطور محاسبه می‌شوند؟
            </h2>
            <p className="mt-1 text-sm leading-7 text-slate-300">
              هر سطح یک حداقل امتیاز دارد. سیستم بعد از ثبت امتیاز، بالاترین سطح
              فعالی را که کاربر حدنصابش را دارد انتخاب می‌کند. سطح ۱ بهتر است از
              صفر امتیاز شروع شود.
            </p>
          </div>
        </div>
      </AdminCard>

      <div className="grid gap-3">
        {levels.map((level) => (
          <AdminCard key={level.id}>
            <LevelForm level={level} />
          </AdminCard>
        ))}
        <AdminCard>
          <h2 className="mb-4 font-black text-white">افزودن سطح جدید</h2>
          <LevelForm />
        </AdminCard>
      </div>
    </>
  );
}

function LevelForm({
  level
}: {
  level?: {
    id: string;
    level: number;
    requiredXP: number;
    name: string | null;
    isActive: boolean;
  };
}) {
  return (
    <form
      action={upsertLevelAction}
      className="grid gap-3"
    >
      {level ? <input type="hidden" name="levelId" value={level.id} /> : null}
      <Field
        name="level"
        label="شماره سطح"
        type="number"
        defaultValue={String(level?.level ?? "")}
        required
      />
      <Field
        name="name"
        label="نام سطح"
        defaultValue={level?.name ?? ""}
        placeholder="مثلاً هم‌قدم"
      />
      <Field
        name="requiredXP"
        label="حداقل امتیاز"
        type="number"
        defaultValue={String(level?.requiredXP ?? "")}
        required
      />
      <div className="grid gap-2">
        <label className="flex h-5 items-center gap-2 text-xs font-bold text-slate-300">
          <input
            name="isActive"
            type="checkbox"
            defaultChecked={level?.isActive ?? true}
            className="accent-[#F59E0B]"
          />
          فعال
        </label>
        <button
          type="submit"
          className="h-11 rounded-xl bg-[#F59E0B] px-4 text-sm font-black text-[#061124]"
        >
          ذخیره
        </button>
      </div>
    </form>
  );
}

function Field({
  name,
  label,
  type = "text",
  defaultValue,
  required,
  placeholder
}: {
  name: string;
  label: string;
  type?: string;
  defaultValue: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-bold text-slate-200">
      {label}
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        placeholder={placeholder}
        className="h-11 rounded-xl border border-white/10 bg-[#061124] px-3 text-white outline-none focus:border-[#F59E0B]"
      />
    </label>
  );
}
