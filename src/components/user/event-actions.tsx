import { RegistrationStatus } from "@prisma/client";
import { CalendarCheck2, LogOut, Send } from "lucide-react";
import Link from "next/link";
import {
  cancelEventRegistrationAction,
  registerForEventAction
} from "@/app/actions";
import { Button } from "@/components/ui/button";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import { secondaryActionClass } from "@/components/user/user-shell";

export function EventActions({
  eventId,
  registrationStatus,
  requiresLogin = false
}: {
  eventId: string;
  registrationStatus?: RegistrationStatus | null;
  requiresLogin?: boolean;
}) {
  if (requiresLogin) {
    return (
      <Link
        href="/open-in-telegram"
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#F59E0B] px-4 text-sm font-black text-[#061124]"
      >
        <Send size={17} aria-hidden="true" />
        برای ثبت‌نام از تلگرام وارد شو
      </Link>
    );
  }

  if (
    registrationStatus === RegistrationStatus.REGISTERED ||
    registrationStatus === RegistrationStatus.WAITLISTED
  ) {
    return (
      <form action={cancelEventRegistrationAction}>
        <input type="hidden" name="eventId" value={eventId} />
        <PendingSubmitButton
          className={`${secondaryActionClass} border-red-400/30 text-red-200 hover:border-red-400/50 hover:bg-red-500/10`}
          pendingLabel="در حال لغو…"
          idleIcon={<LogOut size={16} aria-hidden="true" />}
        >
          {registrationStatus === RegistrationStatus.WAITLISTED
            ? "خروج از لیست انتظار"
            : "لغو ثبت‌نام"}
        </PendingSubmitButton>
      </form>
    );
  }

  return (
    <form action={registerForEventAction}>
      <input type="hidden" name="eventId" value={eventId} />
      <Button
        className="w-full"
        type="submit"
        pendingLabel="در حال ثبت‌نام…"
      >
        <CalendarCheck2 size={17} aria-hidden="true" />
        ثبت‌نام و رزرو جا
      </Button>
    </form>
  );
}
