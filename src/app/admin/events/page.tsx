import { Role } from "@prisma/client";
import { CalendarPlus2, ClipboardCheck, Pencil } from "lucide-react";
import Link from "next/link";
import { AdminCard, PageTitle } from "@/components/admin/admin-card";
import { EventStatusActions } from "@/components/admin/event-status-actions";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/status-pill";
import { prisma } from "@/lib/prisma";
import { hasRole } from "@/modules/auth/authorization";
import { requireEventManagerPage } from "@/modules/auth/admin-session";

export default async function AdminEventsPage() {
  const admin = await requireEventManagerPage();
  const isSuperAdmin = hasRole(admin, Role.SUPER_ADMIN);
  const events = await prisma.event.findMany({
    where: { deletedAt: null },
    orderBy: { date: "desc" },
    include: {
      _count: {
        select: {
          registrations: { where: { status: "REGISTERED" } },
          attendance: { where: { status: "PRESENT" } }
        }
      }
    }
  });

  return (
    <>
      <PageTitle
        title="مدیریت برنامه‌ها"
        subtitle="برنامه بساز، ثبت‌نام را کنترل کن و بعد از اجرا حضور را تأیید کن."
        action={
          <Link href="/admin/events/new" className="block">
            <Button className="w-full">
              <CalendarPlus2 size={18} aria-hidden="true" />
              برنامه جدید
            </Button>
          </Link>
        }
      />
      <details className="mb-4 rounded-xl border border-[#F59E0B]/25 bg-[#0B1E43] p-4">
        <summary className="cursor-pointer font-black text-white">
          معنی وضعیت‌ها
        </summary>
        <p className="mt-2 text-sm leading-7 text-slate-300">
          «آماده ثبت‌نام» برای اعضا نمایش داده می‌شود. «ثبت‌نام بسته» وقتی
          ظرفیت/مهلت تمام شده. بعد از اجرا «برگزار شده» کن و حضور را ثبت کن.
        </p>
      </details>

      <div className="grid gap-3">
        {events.length === 0 ? (
          <AdminCard>
            <p className="text-sm text-slate-300">
              هنوز برنامه‌ای ثبت نشده است.
            </p>
          </AdminCard>
        ) : (
          events.map((event) => (
            <AdminCard key={event.id}>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-black text-white">{event.title}</h2>
                <StatusPill status={event.status} />
              </div>
              <p className="mt-2 text-sm text-slate-300">
                شماره {event.eventNumber}،{" "}
                {new Intl.DateTimeFormat("fa-IR").format(event.date)}،{" "}
                {event.locationName}
              </p>
              <p className="mt-2 text-sm text-slate-400">
                {event._count.registrations} ثبت‌نام، {event._count.attendance}{" "}
                حضور
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {isSuperAdmin ? (
                  <Link
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/15 px-3 text-sm font-bold text-slate-200"
                    href={`/admin/events/${event.id}/edit`}
                  >
                    <Pencil size={16} aria-hidden="true" />
                    ویرایش
                  </Link>
                ) : null}
                <Link
                  className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#F59E0B]/30 px-3 text-sm font-bold text-[#F59E0B] ${isSuperAdmin ? "" : "col-span-2"}`}
                  href={`/admin/events/${event.id}/attendance`}
                >
                  <ClipboardCheck size={16} aria-hidden="true" />
                  حضور و غیاب
                </Link>
              </div>
              <EventStatusActions eventId={event.id} status={event.status} />
            </AdminCard>
          ))
        )}
      </div>
    </>
  );
}
