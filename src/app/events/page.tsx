import { CalendarDays, Info } from "lucide-react";
import { EventCard } from "@/components/user/event-card";
import { UserCard, UserPageHeader } from "@/components/user/user-card";
import { UserPageShell } from "@/components/user/user-shell";
import { prisma } from "@/lib/prisma";
import { getOptionalCurrentUser } from "@/modules/auth/session";

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const currentUser = await getOptionalCurrentUser();
  const events = await prisma.event.findMany({
    where: {
      status: { in: ["PUBLISHED", "REGISTRATION_CLOSED"] },
      deletedAt: null
    },
    orderBy: { date: "asc" },
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

  return (
    <UserPageShell>
      <UserPageHeader
        title="برنامه‌ها"
        subtitle="زمان و محل برنامه‌ها را ببین و جایت را رزرو کن."
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
              بعد از برنامه، حضور تأییدشده به گام و بج‌هایت اضافه می‌شود.
            </p>
          </div>
        </div>
      </UserCard>
      <div className="grid gap-3">
        {events.length === 0 ? (
          <UserCard className="py-10 text-center">
            <CalendarDays
              className="mx-auto text-slate-500"
              size={32}
              aria-hidden="true"
            />
            <h2 className="mt-3 font-black text-white">
              فعلاً برنامه‌ای منتشر نشده
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              برنامه بعدی همین‌جا می‌آید.
            </p>
          </UserCard>
        ) : (
          events.map((event) => (
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
      </div>
    </UserPageShell>
  );
}
