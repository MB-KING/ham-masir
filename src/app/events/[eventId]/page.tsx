import {
  CalendarDays,
  Clock,
  Flag,
  MapPin,
  Navigation,
  UsersRound
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EventActions } from "@/components/user/event-actions";
import { UserCard, UserPageHeader } from "@/components/user/user-card";
import {
  secondaryActionClass,
  UserPageShell
} from "@/components/user/user-shell";
import { miniAppWidthClass } from "@/components/user/mini-app";
import { prisma } from "@/lib/prisma";
import { requireCurrentUserPage } from "@/modules/auth/session";
import { publicEventStatuses } from "@/modules/events/event.repository";
import { MEETING_TIME_LABEL, START_TIME_LABEL } from "@/shared/copy";

export const dynamic = "force-dynamic";

const dateFormatter = new Intl.DateTimeFormat("fa-IR", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric"
});
const shortDateFormatter = new Intl.DateTimeFormat("fa-IR", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit"
});
const timeFormatter = new Intl.DateTimeFormat("fa-IR", {
  hour: "2-digit",
  minute: "2-digit"
});

export default async function EventDetailsPage({
  params
}: {
  params: Promise<{ eventId: string }>;
}) {
  const user = await requireCurrentUserPage();
  const { eventId } = await params;
  const event = await prisma.event.findFirst({
    where: {
      id: eventId,
      deletedAt: null,
      status: { in: publicEventStatuses }
    },
    include: {
      registrations: { where: { userId: user.id }, select: { status: true } },
      _count: {
        select: {
          registrations: { where: { status: "REGISTERED" } },
          attendance: { where: { status: "PRESENT" } }
        }
      }
    }
  });

  if (!event) {
    notFound();
  }

  const registrationCount = event._count.registrations;
  const remainingCapacity =
    event.capacity == null
      ? null
      : Math.max(event.capacity - registrationCount, 0);
  const registrationStatus = event.registrations[0]?.status;

  return (
    <UserPageShell contentClassName="pb-[calc(10.5rem+env(safe-area-inset-bottom))]">
      <UserPageHeader
        title={event.title}
        subtitle={event.description ?? undefined}
        backFallbackHref="/events"
      />

      <UserCard className="mb-4 border-[#F59E0B]/25 bg-[#0B1E43]">
        <p className="text-sm font-bold text-[#F59E0B]">
          برنامه شماره {event.eventNumber}
        </p>
        <div className="mt-4 grid gap-3">
          <Info
            icon={<CalendarDays size={18} />}
            label="تاریخ برنامه"
            value={dateFormatter.format(event.date)}
          />
          <Info
            icon={<Clock size={18} />}
            label={MEETING_TIME_LABEL}
            value={timeFormatter.format(event.meetingTime)}
            tone="accent"
          />
          <Info
            icon={<Flag size={18} />}
            label={START_TIME_LABEL}
            value={timeFormatter.format(event.startTime)}
            tone="accent"
          />
          <Info
            icon={<Clock size={18} />}
            label="پایان تقریبی"
            value={
              event.endTime
                ? timeFormatter.format(event.endTime)
                : "بعدا اعلام می‌شود"
            }
          />
        </div>
        <p className="mt-3 text-xs leading-6 text-slate-400">
          {MEETING_TIME_LABEL}: زمان حاضر شدن در محل. {START_TIME_LABEL}: زمان
          حرکت گروه.
        </p>
      </UserCard>

      <UserCard>
        <h2 className="font-black text-white">جزئیات حضور</h2>
        <dl className="mt-4 grid gap-3 text-sm text-slate-300">
          <Info
            icon={<MapPin size={18} />}
            label="محل قرار"
            value={event.locationName}
          />
          <Info
            icon={<MapPin size={18} />}
            label="آدرس"
            value={event.locationAddress ?? "هنوز ثبت نشده"}
          />
          <Info
            icon={<UsersRound size={18} />}
            label="ثبت‌نام‌شده‌ها"
            value={`${registrationCount} نفر`}
          />
          <Info
            icon={<UsersRound size={18} />}
            label="ظرفیت باقی‌مانده"
            value={
              remainingCapacity == null
                ? "بدون محدودیت"
                : `${remainingCapacity} نفر`
            }
          />
          <Info
            label="آخرین زمان ثبت‌نام"
            value={
              event.registrationDeadline
                ? `${shortDateFormatter.format(event.registrationDeadline)}، ساعت ${timeFormatter.format(event.registrationDeadline)}`
                : "تا تکمیل ظرفیت"
            }
          />
        </dl>
        {event.latitude && event.longitude ? (
          <Link
            href={`https://www.google.com/maps?q=${event.latitude.toString()},${event.longitude.toString()}`}
            target="_blank"
            rel="noreferrer"
            className={`${secondaryActionClass} mt-3 border-[#F59E0B]/30 text-[#F59E0B]`}
          >
            <Navigation size={16} aria-hidden="true" />
            باز کردن محل روی نقشه
          </Link>
        ) : null}
      </UserCard>

      <div
        className={`fixed bottom-[calc(4.1rem+env(safe-area-inset-bottom))] left-1/2 z-40 w-full -translate-x-1/2 px-4 ${miniAppWidthClass}`}
      >
        <div className="rounded-2xl border border-white/10 bg-[#07162E]/95 p-3 shadow-[0_-8px_24px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <EventActions
            eventId={event.id}
            registrationStatus={registrationStatus}
          />
        </div>
      </div>
    </UserPageShell>
  );
}

function Info({
  label,
  value,
  icon,
  tone = "default"
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  tone?: "default" | "accent";
}) {
  return (
    <div
      className={
        tone === "accent"
          ? "rounded-xl bg-[#F59E0B]/15 p-3 ring-1 ring-[#F59E0B]/25"
          : "rounded-xl bg-white/10 p-3"
      }
    >
      <dt className="flex items-center gap-2 text-xs font-bold text-[#F59E0B]">
        {icon}
        {label}
      </dt>
      <dd className="mt-1 font-bold text-white">{value}</dd>
    </div>
  );
}
