import { EventStatus } from "@prisma/client";
import { CalendarDays, Info } from "lucide-react";
import { EventCard } from "@/components/user/event-card";
import { UserCard, UserPageHeader } from "@/components/user/user-card";
import { UserPageShell } from "@/components/user/user-shell";
import { prisma } from "@/lib/prisma";
import { getOptionalCurrentUser } from "@/modules/auth/session";
import { publicEventStatuses } from "@/modules/events/event.repository";

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const currentUser = await getOptionalCurrentUser();
  const events = await prisma.event.findMany({
    where: {
      status: { in: publicEventStatuses },
      deletedAt: null
    },
    orderBy: { date: "desc" },
    include: {
      _count: { select: { registrations: { where: { status: "REGISTERED" } } } },
      registrations: currentUser
        ? {
            where: {
              userId: currentUser.id,
              status: { in: ["REGISTERED", "WAITLISTED"] }
            },
            select: { status: true },
            take: 1
          }
        : false
    }
  });

  const upcoming = events
    .filter((event) => event.status !== EventStatus.COMPLETED)
    .sort((a, b) => a.date.getTime() - b.date.getTime());
  const completed = events.filter(
    (event) => event.status === EventStatus.COMPLETED
  );

  return (
    <UserPageShell>
      <UserPageHeader
        title="برنامه‌ها"
        subtitle="برنامه‌های پیش رو را رزرو کن و آرشیو برگزارشده‌ها را ببین."
        backFallbackHref="/"
      />
      <UserCard className="mb-4 border-[#F59E0B]/25 bg-[#0B1E43]">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F59E0B]/15 text-[#F59E0B]">
            <Info size={20} aria-hidden="true" />
          </div>
          <div>
            <h2 className="font-black text-white">ثبت‌نام یعنی رزرو جا</h2>
            <p className="mt-1 text-sm leading-7 text-slate-300">
              بعد از برگزاری، برنامه از لیست حذف نمی‌شود؛ نظرات و عکس‌های
              تأییدشده همین‌جا می‌ماند.
            </p>
          </div>
        </div>
      </UserCard>

      <section className="grid gap-3">
        <h2 className="text-lg font-black text-white">برنامه‌های پیش رو</h2>
        {upcoming.length === 0 ? (
          <UserCard className="py-10 text-center">
            <CalendarDays
              className="mx-auto text-slate-500"
              size={32}
              aria-hidden="true"
            />
            <h3 className="mt-3 font-black text-white">
              فعلاً برنامه‌ای برای ثبت‌نام نیست
            </h3>
            <p className="mt-2 text-sm text-slate-400">
              برنامه بعدی همین‌جا می‌آید.
            </p>
          </UserCard>
        ) : (
          upcoming.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              registrationStatus={
                Array.isArray(event.registrations)
                  ? event.registrations[0]?.status
                  : undefined
              }
            />
          ))
        )}
      </section>

      {completed.length > 0 ? (
        <section className="mt-8 grid gap-3">
          <h2 className="text-lg font-black text-white">برگزار شده</h2>
          <p className="text-sm leading-7 text-slate-400">
            نظرات و عکس‌های همراهان را ببین؛ اگر حضور داشتی می‌توانی خودت هم
            اضافه کنی.
          </p>
          {completed.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              registrationStatus={
                Array.isArray(event.registrations)
                  ? event.registrations[0]?.status
                  : undefined
              }
            />
          ))}
        </section>
      ) : null}
    </UserPageShell>
  );
}
