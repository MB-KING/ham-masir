import { Role } from "@prisma/client";
import { ArrowLeft, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { BrandMark } from "@/components/brand/brand-mark";
import { EventCard } from "@/components/user/event-card";
import { NotificationsBell } from "@/components/user/notifications-bell";
import {
  secondaryActionClass,
  UserPageShell
} from "@/components/user/user-shell";
import { defaultCommunitySlug } from "@/lib/config";
import { prisma } from "@/lib/prisma";
import { hasAnyRole } from "@/modules/auth/authorization";
import { getOptionalCurrentUser } from "@/modules/auth/session";

async function getHomeData() {
  const currentUser = await getOptionalCurrentUser();
  const [events, community] = await Promise.all([
    prisma.event.findMany({
      where: { status: "PUBLISHED", deletedAt: null },
      orderBy: { date: "asc" },
      take: 2,
      include: {
        _count: {
          select: { registrations: { where: { status: "REGISTERED" } } }
        },
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
    }),
    prisma.community.findFirst({
      where: currentUser
        ? { id: currentUser.communityId }
        : { slug: defaultCommunitySlug, isActive: true },
      select: { name: true, tagline: true }
    })
  ]);

  return {
    events,
    communityName: community?.name ?? "هم مسیر",
    communityTagline: community?.tagline ?? "یک مسیر، هزار تجربه",
    canOpenAdmin: currentUser
      ? hasAnyRole(currentUser, [Role.ADMIN, Role.SUPER_ADMIN])
      : false
  };
}

export default async function Home() {
  const { events, communityName, communityTagline, canOpenAdmin } =
    await getHomeData();

  return (
    <UserPageShell className="flex flex-col">
      <header className="mb-5 overflow-hidden rounded-xl border border-white/10 bg-[#0B1E43]">
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <BrandMark size={72} priority />
              <div className="min-w-0">
                <h1 className="break-words text-2xl font-black text-white">
                  {communityName}
                </h1>
                <p className="mt-1 text-sm font-bold text-[#F59E0B]">
                  {communityTagline}
                </p>
              </div>
            </div>
            <NotificationsBell />
          </div>
          {canOpenAdmin ? (
            <Link className={`${secondaryActionClass} mt-4`} href="/admin">
              <LayoutDashboard size={16} aria-hidden="true" />
              پنل مدیریت
            </Link>
          ) : null}
        </div>
        <div className="h-1.5 w-full bg-gradient-to-l from-[#F59E0B] via-[#FBBF24] to-transparent" />
      </header>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-xl font-black text-white">برنامه‌های نزدیک</h2>
          <Link
            className="inline-flex min-h-11 items-center gap-1 text-sm font-bold text-[#F59E0B]"
            href="/events"
          >
            همه
            <ArrowLeft size={15} aria-hidden="true" />
          </Link>
        </div>
        {events.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.04] p-6 text-center text-sm text-slate-300">
            فعلا برنامه‌ای برای ثبت‌نام منتشر نشده است.
          </div>
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
      </section>
    </UserPageShell>
  );
}
