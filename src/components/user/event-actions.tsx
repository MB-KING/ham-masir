import { RegistrationStatus } from "@prisma/client";
import { CalendarCheck2, LogOut } from "lucide-react";
import {
  cancelEventRegistrationAction,
  registerForEventAction
} from "@/app/actions";
import { Button } from "@/components/ui/button";
import { secondaryActionClass } from "@/components/user/user-shell";

export function EventActions({
  eventId,
  registrationStatus
}: {
  eventId: string;
  registrationStatus?: RegistrationStatus | null;
}) {
  if (
    registrationStatus === RegistrationStatus.REGISTERED ||
    registrationStatus === RegistrationStatus.WAITLISTED
  ) {
    return (
      <form action={cancelEventRegistrationAction}>
        <input type="hidden" name="eventId" value={eventId} />
        <button
          className={`${secondaryActionClass} border-red-400/30 text-red-200 hover:border-red-400/50 hover:bg-red-500/10`}
          type="submit"
        >
          <LogOut size={16} aria-hidden="true" />
          {registrationStatus === RegistrationStatus.WAITLISTED
            ? "خروج از لیست انتظار"
            : "لغو ثبت‌نام"}
        </button>
      </form>
    );
  }

  return (
    <form action={registerForEventAction}>
      <input type="hidden" name="eventId" value={eventId} />
      <Button className="w-full" type="submit">
        <CalendarCheck2 size={17} aria-hidden="true" />
        ثبت‌نام و رزرو جا
      </Button>
    </form>
  );
}
