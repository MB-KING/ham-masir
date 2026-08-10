import { ArrowLeft, CalendarDays, Clock3, MapPin, Route, UsersRound } from "lucide-react";
import Link from "next/link";
import { UserCard } from "@/components/user/user-card";
import { MEETING_TIME_LABEL, START_TIME_LABEL } from "@/shared/copy";

const dateFormatter = new Intl.DateTimeFormat("fa-IR", {
  weekday: "long",
  month: "long",
  day: "numeric"
});
const timeFormatter = new Intl.DateTimeFormat("fa-IR", {
  hour: "2-digit",
  minute: "2-digit"
});

type EventCardEvent = {
  id: string;
  title: string;
  eventNumber: number;
  date: Date;
  meetingTime: Date;
  startTime: Date;
  locationName: string;
  capacity: number | null;
  _count: { registrations: number };
};

export function EventCard({ event }: { event: EventCardEvent }) {
  const remaining =
    event.capacity == null
      ? null
      : Math.max(event.capacity - event._count.registrations, 0);

  return (
    <UserCard className="overflow-hidden p-0">
      <div className="border-b border-white/10 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F59E0B]/15 text-[#F59E0B]">
            <Route size={22} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-[#F59E0B]">
              برنامه شماره {event.eventNumber}
            </p>
            <h2 className="mt-1 break-words text-lg font-black text-white">
              {event.title}
            </h2>
          </div>
        </div>
        <div className="mt-4 grid gap-2 text-sm text-slate-300">
          <Meta
            Icon={CalendarDays}
            text={dateFormatter.format(event.date)}
          />
          <Meta
            Icon={Clock3}
            text={`${MEETING_TIME_LABEL} ${timeFormatter.format(event.meetingTime)}`}
          />
          <Meta
            Icon={Clock3}
            text={`${START_TIME_LABEL} ${timeFormatter.format(event.startTime)}`}
          />
          <Meta Icon={MapPin} text={event.locationName} />
          <Meta
            Icon={UsersRound}
            text={
              remaining == null
                ? `${event._count.registrations} نفر همراه`
                : `${event._count.registrations} همراه · ${remaining} جای خالی`
            }
          />
        </div>
      </div>
      <div className="p-4">
        <Link
          href={`/events/${event.id}` as `/events/${string}`}
          className="inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#F59E0B] px-4 text-sm font-black text-[#061124] shadow-sm shadow-[#F59E0B]/20 transition active:scale-[0.99] hover:bg-[#FBBF24]"
        >
          مشاهده و ثبت‌نام
          <ArrowLeft size={16} aria-hidden="true" />
        </Link>
      </div>
    </UserCard>
  );
}

function Meta({
  Icon,
  text
}: {
  Icon: typeof CalendarDays;
  text: string;
}) {
  return (
    <span className="flex min-w-0 items-center gap-2 rounded-xl bg-white/[0.05] px-3 py-2">
      <Icon size={16} className="shrink-0 text-[#F59E0B]" aria-hidden="true" />
      <span className="truncate">{text}</span>
    </span>
  );
}
