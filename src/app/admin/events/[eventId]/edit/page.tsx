import { EventStatus } from "@prisma/client";
import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  updateEventAction,
  uploadEventImageAction
} from "@/app/admin/actions";
import { AdminCard, PageTitle } from "@/components/admin/admin-card";
import { Button } from "@/components/ui/button";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminPage } from "@/modules/auth/admin-session";
import { mediaPublicPath } from "@/modules/media/media.service";
import {
  dateInputValue,
  dateTimeInputValue,
  timeInputValue
} from "@/shared/form-date";

export default async function EditEventPage({
  params,
  searchParams
}: {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  await requireSuperAdminPage();
  const { eventId } = await params;
  const { error, ok } = await searchParams;
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      images: { orderBy: { sortOrder: "asc" }, include: { mediaAsset: true } }
    }
  });

  if (!event) {
    notFound();
  }

  return (
    <>
      <PageTitle
        showBack
        backFallbackHref="/admin/events"
        title="ویرایش برنامه"
        subtitle="سوپرادمین می‌تواند اطلاعات اصلی، زمان، مکان، ظرفیت و وضعیت برنامه را اصلاح کند."
      />
      {ok === "image" ? (
        <AdminCard className="mb-4 border-emerald-400/30 bg-emerald-500/10">
          <p className="text-sm font-bold text-emerald-200">تصویر با موفقیت اضافه شد.</p>
        </AdminCard>
      ) : null}
      {error ? (
        <AdminCard className="mb-4 border-red-400/30 bg-red-500/10">
          <p className="text-sm font-bold text-red-200">{error}</p>
        </AdminCard>
      ) : null}
      <div className="mb-4 flex flex-wrap gap-2">
        <Link
          href={`/admin/events/${eventId}/feedback` as Route}
          className="inline-flex h-11 items-center rounded-xl bg-white/10 px-4 text-sm font-bold text-white"
        >
          نظرات برنامه
        </Link>
      </div>
      <AdminCard className="mb-4">
        <h2 className="mb-3 font-black text-white">تصاویر برنامه</h2>
        <div className="mb-3 grid gap-2">
          {event.images.map((image) => (
            <a
              key={image.id}
              href={mediaPublicPath(image.mediaAssetId)}
              target="_blank"
              rel="noreferrer"
              className="truncate text-sm font-bold text-[#F59E0B]"
            >
              {image.caption || image.mediaAssetId}
            </a>
          ))}
        </div>
        <form action={uploadEventImageAction} className="grid gap-3">
          <input type="hidden" name="eventId" value={event.id} />
          <label className="grid gap-2 text-sm font-bold text-slate-200">
            آپلود تصویر
            <input
              name="image"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              required
              className="text-sm text-slate-300"
            />
          </label>
          <label className="grid gap-2 text-sm font-bold text-slate-200">
            توضیح کوتاه
            <input
              name="caption"
              className="h-11 rounded-xl border border-white/10 bg-[#061124] px-3 text-white"
            />
          </label>
          <PendingSubmitButton
            className="w-full bg-white/10 text-sm font-bold text-white"
            pendingLabel="در حال آپلود…"
          >
            افزودن تصویر
          </PendingSubmitButton>
        </form>
      </AdminCard>
      <AdminCard>
        <form action={updateEventAction} className="grid gap-4">
          <input type="hidden" name="eventId" value={event.id} />
          <Field
            label="نام برنامه"
            name="title"
            required
            defaultValue={event.title}
          />
          <Field
            label="شماره برنامه"
            name="eventNumber"
            type="number"
            required
            defaultValue={String(event.eventNumber)}
          />
          <Field
            label="تاریخ برگزاری"
            name="date"
            type="date"
            required
            defaultValue={dateInputValue(event.date)}
          />
          <Field
            label="زمان دورهمی"
            name="meetingTime"
            type="time"
            required
            defaultValue={timeInputValue(event.meetingTime)}
          />
          <Field
            label="زمان شروع مسیر"
            name="startTime"
            type="time"
            required
            defaultValue={timeInputValue(event.startTime)}
          />
          <Field
            label="زمان پایان تقریبی"
            name="endTime"
            type="time"
            defaultValue={timeInputValue(event.endTime)}
          />
          <Field
            label="آخرین زمان ثبت‌نام"
            name="registrationDeadline"
            type="datetime-local"
            defaultValue={dateTimeInputValue(event.registrationDeadline)}
          />
          <Field
            label="شروع بازه حضور و غیاب"
            name="checkInStartsAt"
            type="datetime-local"
            defaultValue={dateTimeInputValue(event.checkInStartsAt)}
          />
          <Field
            label="پایان بازه حضور و غیاب"
            name="checkInEndsAt"
            type="datetime-local"
            defaultValue={dateTimeInputValue(event.checkInEndsAt)}
          />
          <Field
            label="نام محل قرار"
            name="locationName"
            required
            defaultValue={event.locationName}
          />
          <Field
            label="ظرفیت"
            name="capacity"
            type="number"
            defaultValue={event.capacity ? String(event.capacity) : ""}
          />
          <Field
            label="عرض جغرافیایی"
            name="latitude"
            type="number"
            step="any"
            defaultValue={event.latitude?.toString() ?? ""}
          />
          <Field
            label="طول جغرافیایی"
            name="longitude"
            type="number"
            step="any"
            defaultValue={event.longitude?.toString() ?? ""}
          />
          <label className="grid gap-2 text-sm font-bold text-slate-200">
            وضعیت نمایش
            <select
              name="status"
              defaultValue={event.status}
              className="h-11 rounded-xl border border-white/10 bg-[#061124] px-3 text-white outline-none focus:border-[#F59E0B]"
            >
              <option value={EventStatus.DRAFT}>پیش‌نویس</option>
              <option value={EventStatus.PUBLISHED}>آماده ثبت‌نام</option>
              <option value={EventStatus.REGISTRATION_CLOSED}>
                ثبت‌نام بسته
              </option>
              <option value={EventStatus.COMPLETED}>برگزار شده</option>
              <option value={EventStatus.CANCELLED}>لغو شده</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-bold text-slate-200">
            آدرس محل قرار
            <input
              name="locationAddress"
              defaultValue={event.locationAddress ?? ""}
              className="h-11 rounded-xl border border-white/10 bg-[#061124] px-3 text-white outline-none focus:border-[#F59E0B]"
            />
          </label>
          <label className="grid gap-2 text-sm font-bold text-slate-200">
            توضیحات
            <textarea
              name="description"
              rows={4}
              defaultValue={event.description ?? ""}
              className="rounded-xl border border-white/10 bg-[#061124] px-3 py-3 text-white outline-none focus:border-[#F59E0B]"
            />
          </label>
          <div>
            <Button
              className="w-full"
              type="submit"
              pendingLabel="در حال ذخیره…"
            >
              ذخیره تغییرات
            </Button>
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
  defaultValue,
  className,
  step
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
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
        defaultValue={defaultValue}
        step={step}
        className="h-11 rounded-xl border border-white/10 bg-[#061124] px-3 text-white outline-none focus:border-[#F59E0B]"
      />
    </label>
  );
}
