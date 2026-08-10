"use client";

import { EventStatus } from "@prisma/client";
import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";
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

function StatusSubmitButton({
  label,
  danger
}: {
  label: string;
  danger?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      className={cn(
        "inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70",
        danger
          ? "border border-red-400/30 bg-red-500/10 text-red-200"
          : "bg-white/10 text-slate-100 hover:bg-white/15"
      )}
      type="submit"
      disabled={pending}
      aria-busy={pending || undefined}
    >
      {pending ? (
        <>
          <Loader2 size={16} className="animate-spin" aria-hidden="true" />
          در حال انجام…
        </>
      ) : (
        label
      )}
    </button>
  );
}

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
          <StatusSubmitButton label={action.label} danger={action.danger} />
        </form>
      ))}
    </div>
  );
}
