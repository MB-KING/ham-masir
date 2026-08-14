"use client";

import { Star } from "lucide-react";
import { submitEventFeedbackAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { labelOf, moderationStatusLabels } from "@/shared/labels";

export function FeedbackForm({
  eventId,
  existing
}: {
  eventId: string;
  existing?: {
    rating: number;
    comment: string | null;
    status?: string;
  } | null;
}) {
  const status = existing?.status;

  return (
    <form action={submitEventFeedbackAction} className="mt-3 grid gap-3">
      <input type="hidden" name="eventId" value={eventId} />
      {status ? (
        <p
          className={
            status === "APPROVED"
              ? "rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm font-bold text-emerald-200"
              : status === "REJECTED"
                ? "rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm font-bold text-red-200"
                : "rounded-xl border border-[#F59E0B]/30 bg-[#F59E0B]/10 px-3 py-2 text-sm font-bold text-[#FDE68A]"
          }
        >
          وضعیت نظر: {labelOf(moderationStatusLabels, status)}
          {status === "PENDING"
            ? " — بعد از تأیید ادمین نمایش داده می‌شود."
            : status === "REJECTED"
              ? " — می‌توانی دوباره بفرستی."
              : " — اگر ویرایش کنی دوباره بررسی می‌شود."}
        </p>
      ) : (
        <p className="text-sm leading-7 text-slate-400">
          نظر بعد از تأیید ادمین برای بقیه نمایش داده می‌شود.
        </p>
      )}
      <label className="grid gap-2 text-sm font-bold text-slate-200">
        امتیاز شما
        <select
          name="rating"
          defaultValue={existing?.rating ?? 5}
          className="h-11 cursor-pointer rounded-xl border border-white/10 bg-[#061124] px-3 text-white"
          required
        >
          {[5, 4, 3, 2, 1].map((value) => (
            <option key={value} value={value}>
              {value} ستاره
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-2 text-sm font-bold text-slate-200">
        نظر (اختیاری)
        <textarea
          name="comment"
          rows={3}
          maxLength={500}
          defaultValue={existing?.comment ?? ""}
          className="rounded-xl border border-white/10 bg-[#061124] px-3 py-3 text-white"
          placeholder="تجربه‌ات از این برنامه را بنویس"
        />
      </label>
      <Button type="submit" className="w-full" pendingLabel="در حال ثبت…">
        <Star size={16} aria-hidden="true" />
        {existing ? "به‌روزرسانی نظر" : "ثبت نظر"}
      </Button>
    </form>
  );
}
