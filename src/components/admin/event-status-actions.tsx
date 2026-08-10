"use client";

import { EventStatus } from "@prisma/client";
import { setEventStatusAction } from "@/app/admin/actions";
import { cn } from "@/lib/cn";

const transitions: Record<
  EventStatus,
  Array<{ status: EventStatus; label: string; danger?: boolean }>
> = {
  DRAFT: [{ status: EventStatus.PUBLISHED, label: "باز کردن ثبت‌نام" }],
  PUBLISHED: [
    { status: EventStatus.REGISTRATION_CLOSED, label: "بستن ثبت‌نام" },
    { status: EventStatus.COMPLETED, label: "برگزار شد" },
    { status: EventStatus.CANCELLED, label: "لغو برنامه", danger: true }
  ],
  REGISTRATION_CLOSED: [
    { status: EventStatus.PUBLISHED, label: "باز کردن دوباره ثبت‌نام" },
    { status: EventStatus.COMPLETED, label: "برگزار شد" },
    { status: EventStatus.CANCELLED, label: "لغو برنامه", danger: true }
  ],
  COMPLETED: [{ status: EventStatus.PUBLISHED, label: "بازگشت به آماده ثبت‌نام" }],
  CANCELLED: [{ status: EventStatus.DRAFT, label: "برگرداندن به پیش‌نویس" }]
};

export function EventStatusActions({
  eventId,
  status
}: {
  eventId: string;
  status: EventStatus;
}) {
  const actions = transitions[status] ?? [];

  if (actions.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 grid gap-2">
      {actions.map((action) => (
        <form
          key={action.status}
          action={setEventStatusAction}
          onSubmit={(event) => {
            if (
              action.danger &&
              !window.confirm("این برنامه لغو شود؟ اعضا دیگر آن را نمی‌بینند.")
            ) {
              event.preventDefault();
            }
          }}
        >
          <input type="hidden" name="eventId" value={eventId} />
          <input type="hidden" name="status" value={action.status} />
          <button
            className={cn(
              "inline-flex min-h-11 w-full items-center justify-center rounded-xl px-3 text-sm font-bold transition active:scale-[0.99]",
              action.danger
                ? "border border-red-400/30 bg-red-500/10 text-red-200"
                : "bg-white/10 text-slate-100 hover:bg-white/15"
            )}
            type="submit"
          >
            {action.label}
          </button>
        </form>
      ))}
    </div>
  );
}
