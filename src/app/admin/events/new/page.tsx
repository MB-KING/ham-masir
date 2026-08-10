import { EventStatus } from "@prisma/client";
import { createEventAction } from "@/app/admin/actions";
import { AdminCard, PageTitle } from "@/components/admin/admin-card";
import { requireEventManagerPage } from "@/modules/auth/admin-session";

export default async function NewEventPage() {
  await requireEventManagerPage();

  return (
    <>
      <PageTitle
        showBack
        backFallbackHref="/admin/events"
        title="برنامه جدید"
        subtitle="اطلاعاتی را وارد کن که عضو برای تصمیم‌گیری سریع و راحت نیاز دارد."
      />

      <AdminCard>
        <form action={createEventAction} className="grid gap-4">
          <Field
            label="نام برنامه"
            name="title"
            required
            placeholder="مثلا ۱۲۰امین برنامه پیاده‌روی گروهی"
          />
          <Field
            label="شماره برنامه"
            name="eventNumber"
            type="number"
            required
            placeholder="120"
          />
          <Field label="تاریخ برگزاری" name="date" type="date" required />
          <Field label="زمان دورهمی" name="meetingTime" type="time" required />
          <Field label="زمان شروع مسیر" name="startTime" type="time" required />
          <Field label="زمان پایان تقریبی" name="endTime" type="time" />
          <Field
            label="آخرین زمان ثبت‌نام"
            name="registrationDeadline"
            type="datetime-local"
          />
          <Field
            label="شروع بازه حضور و غیاب"
            name="checkInStartsAt"
            type="datetime-local"
          />
          <Field
            label="پایان بازه حضور و غیاب"
            name="checkInEndsAt"
            type="datetime-local"
          />
          <Field
            label="نام محل قرار"
            name="locationName"
            required
            placeholder="بوستان آب و آتش"
          />
          <Field label="ظرفیت" name="capacity" type="number" placeholder="80" />
          <Field
            label="عرض جغرافیایی"
            name="latitude"
            type="number"
            placeholder="35.744"
            step="any"
          />
          <Field
            label="طول جغرافیایی"
            name="longitude"
            type="number"
            placeholder="51.410"
            step="any"
          />
          <label className="grid gap-2 text-sm font-bold text-slate-200">
            وضعیت نمایش
            <select
              name="status"
              defaultValue={EventStatus.PUBLISHED}
              className="h-11 rounded-xl border border-white/10 bg-[#061124] px-3 text-white outline-none focus:border-[#F59E0B]"
            >
              <option value={EventStatus.DRAFT}>ذخیره به‌عنوان پیش‌نویس</option>
              <option value={EventStatus.PUBLISHED}>
                نمایش و باز کردن ثبت‌نام
              </option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-bold text-slate-200">
            آدرس محل قرار
            <input
              name="locationAddress"
              className="h-11 rounded-xl border border-white/10 bg-[#061124] px-3 text-white outline-none focus:border-[#F59E0B]"
              placeholder="مثلا کنار ورودی اصلی پارک"
            />
          </label>
          <label className="grid gap-2 text-sm font-bold text-slate-200">
            توضیحات کوتاه برای اعضا
            <textarea
              name="description"
              rows={4}
              className="rounded-xl border border-white/10 bg-[#061124] px-3 py-3 text-white outline-none focus:border-[#F59E0B]"
              placeholder="مسیر، وسایل پیشنهادی، سطح سختی و نکته‌های مهم را کوتاه و روشن بنویس."
            />
          </label>
          <div>
            <button
              className="min-h-11 w-full rounded-xl bg-[#F59E0B] px-5 text-sm font-black text-[#061124]"
              type="submit"
            >
              ساخت برنامه
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
  type = "text",
  required,
  placeholder,
  className,
  step
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  className?: string;
  step?: string;
}) {
  return (
    <label
      className={`grid gap-2 text-sm font-bold text-slate-200 ${className ?? ""}`}
    >
      {label}
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        step={step}
        className="h-11 rounded-xl border border-white/10 bg-[#061124] px-3 text-white outline-none focus:border-[#F59E0B]"
      />
    </label>
  );
}
