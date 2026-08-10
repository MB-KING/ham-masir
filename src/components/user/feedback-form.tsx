import { Star } from "lucide-react";
import { submitEventFeedbackAction } from "@/app/actions";

export function FeedbackForm({
  eventId,
  existing
}: {
  eventId: string;
  existing?: { rating: number; comment: string | null } | null;
}) {
  return (
    <form action={submitEventFeedbackAction} className="mt-3 grid gap-3">
      <input type="hidden" name="eventId" value={eventId} />
      <label className="grid gap-2 text-sm font-bold text-slate-200">
        امتیاز شما
        <select
          name="rating"
          defaultValue={existing?.rating ?? 5}
          className="h-11 rounded-xl border border-white/10 bg-[#061124] px-3 text-white"
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
      <button
        type="submit"
        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#F59E0B] text-sm font-black text-[#061124]"
      >
        <Star size={16} aria-hidden="true" />
        {existing ? "به‌روزرسانی نظر" : "ثبت نظر"}
      </button>
    </form>
  );
}
