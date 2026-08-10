import {
  CalendarDays,
  Clock,
  Flag,
  MapPin,
  UsersRound
} from "lucide-react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { EventActions } from "@/components/user/event-actions";
import { FeedbackForm } from "@/components/user/feedback-form";
import { NavigationSheet } from "@/components/user/navigation-sheet";
import { ParticipantsPreview } from "@/components/user/participants-preview";
import { ShareCardButton } from "@/components/user/share-card-button";
import { UserCard, UserPageHeader } from "@/components/user/user-card";
import { UserPageShell } from "@/components/user/user-shell";
import { miniAppWidthClass } from "@/components/user/mini-app";
import { prisma } from "@/lib/prisma";
import { getOptionalCurrentUser } from "@/modules/auth/session";
import { publicEventStatuses } from "@/modules/events/event.repository";
import { mediaPublicPath } from "@/modules/media/media.service";
import { MEETING_TIME_LABEL, START_TIME_LABEL } from "@/shared/copy";
import { errorMessagesFa, type ErrorCode } from "@/shared/errors";

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
  params,
  searchParams
}: {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const user = await getOptionalCurrentUser();
  const { eventId } = await params;
  const { error, ok } = await searchParams;
  const event = await prisma.event.findFirst({
    where: {
      id: eventId,
      deletedAt: null,
      status: { in: publicEventStatuses }
    },
    include: {
      registrations: user
        ? { where: { userId: user.id }, select: { status: true } }
        : false,
      images: {
        orderBy: { sortOrder: "asc" },
        include: { mediaAsset: true }
      },
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

  const previewRegs = await prisma.eventRegistration.findMany({
    where: {
      eventId,
      status: "REGISTERED",
      user: { profile: { showInMembersDirectory: true } }
    },
    orderBy: { registeredAt: "asc" },
    take: 3,
    select: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          username: true,
          photoUrl: true
        }
      }
    }
  });

  const registrationCount = event._count.registrations;
  const remainingCapacity =
    event.capacity == null
      ? null
      : Math.max(event.capacity - registrationCount, 0);
  const registrationStatus = Array.isArray(event.registrations)
    ? event.registrations[0]?.status
    : undefined;

  const [attendance, feedback] = user
    ? await Promise.all([
        prisma.attendance.findUnique({
          where: { userId_eventId: { userId: user.id, eventId } }
        }),
        prisma.eventFeedback.findUnique({
          where: { eventId_userId: { eventId, userId: user.id } }
        })
      ])
    : [null, null];

  const canFeedback =
    event.status === "COMPLETED" && attendance?.status === "PRESENT";

  return (
    <UserPageShell contentClassName="pb-[calc(10.5rem+env(safe-area-inset-bottom))]">
      <UserPageHeader
        title={event.title}
        subtitle={event.description ?? undefined}
        backFallbackHref="/events"
      />

      {error && error in errorMessagesFa ? (
        <UserCard className="mb-4 border-red-400/30 bg-red-500/10">
          <p className="text-sm font-bold text-red-200">
            {errorMessagesFa[error as ErrorCode]}
          </p>
        </UserCard>
      ) : null}
      {ok === "registered" ? (
        <UserCard className="mb-4 border-emerald-400/30 bg-emerald-500/10">
          <p className="text-sm font-bold text-emerald-200">
            ثبت‌نام با موفقیت انجام شد.
          </p>
        </UserCard>
      ) : null}
      {ok === "cancelled" ? (
        <UserCard className="mb-4 border-sky-400/30 bg-sky-500/10">
          <p className="text-sm font-bold text-sky-200">ثبت‌نام لغو شد.</p>
        </UserCard>
      ) : null}
      {ok === "feedback" ? (
        <UserCard className="mb-4 border-emerald-400/30 bg-emerald-500/10">
          <p className="text-sm font-bold text-emerald-200">نظرت ثبت شد.</p>
        </UserCard>
      ) : null}

      {event.images.length > 0 ? (
        <UserCard className="mb-4 overflow-hidden p-0">
          <div className="relative aspect-[16/10] w-full bg-[#0B1E43]">
            <Image
              src={mediaPublicPath(event.images[0].mediaAssetId)}
              alt={event.images[0].caption ?? event.title}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          {event.images.length > 1 ? (
            <div className="flex gap-2 overflow-x-auto p-3">
              {event.images.slice(1).map((image) => (
                <div
                  key={image.id}
                  className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg"
                >
                  <Image
                    src={mediaPublicPath(image.mediaAssetId)}
                    alt={image.caption ?? event.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ))}
            </div>
          ) : null}
        </UserCard>
      ) : null}

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
        <ParticipantsPreview
          eventId={event.id}
          total={registrationCount}
          users={previewRegs.map((row) => row.user)}
        />
        {event.latitude != null && event.longitude != null ? (
          <NavigationSheet
            latitude={Number(event.latitude)}
            longitude={Number(event.longitude)}
          />
        ) : null}
        <ShareCardButton eventId={event.id} />
      </UserCard>

      {canFeedback ? (
        <UserCard className="mt-4">
          <h2 className="font-black text-white">نظر درباره این برنامه</h2>
          <p className="mt-1 text-sm text-slate-400">
            حضورت تأیید شده؛ تجربه‌ات را با بقیه به اشتراک بگذار.
          </p>
          <FeedbackForm eventId={event.id} existing={feedback} />
        </UserCard>
      ) : null}

      <div
        className={`fixed bottom-[calc(4.1rem+env(safe-area-inset-bottom))] left-1/2 z-40 w-full -translate-x-1/2 px-4 ${miniAppWidthClass}`}
      >
        <div className="rounded-2xl border border-white/10 bg-[#07162E]/95 p-3 shadow-[0_-8px_24px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <EventActions
            eventId={event.id}
            registrationStatus={registrationStatus}
            requiresLogin={!user}
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
