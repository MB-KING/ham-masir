import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminCard, PageTitle } from "@/components/admin/admin-card";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminPage } from "@/modules/auth/admin-session";
import { FeedbackService } from "@/modules/feedback/feedback.service";
import { getDisplayName } from "@/shared/privacy";

export default async function AdminEventFeedbackPage({
  params
}: {
  params: Promise<{ eventId: string }>;
}) {
  await requireSuperAdminPage();
  const { eventId } = await params;
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true, title: true, eventNumber: true }
  });
  if (!event) notFound();

  const service = new FeedbackService();
  const [stats, items] = await Promise.all([
    service.statsForEvent(eventId),
    service.listForEvent(eventId)
  ]);

  return (
    <>
      <PageTitle
        title={`نظرات برنامه ${event.eventNumber}`}
        subtitle={event.title}
      />
      <AdminCard className="mb-4">
        <p className="text-sm text-slate-300">
          میانگین:{" "}
          <span className="font-black text-[#F59E0B]">
            {stats.average.toFixed(1)}
          </span>{" "}
          از {stats.count.toLocaleString("fa-IR")} نظر
        </p>
        <Link
          href={`/admin/events/${eventId}/edit`}
          className="mt-3 inline-flex text-sm font-bold text-[#F59E0B]"
        >
          بازگشت به ویرایش برنامه
        </Link>
      </AdminCard>
      <div className="grid gap-3">
        {items.length === 0 ? (
          <AdminCard className="text-sm text-slate-400">هنوز نظری ثبت نشده.</AdminCard>
        ) : (
          items.map((item) => (
            <AdminCard key={item.id}>
              <div className="flex items-center justify-between gap-2">
                <p className="font-black text-white">
                  {getDisplayName(item.user)}
                </p>
                <p className="text-sm font-bold text-[#F59E0B]">
                  {item.rating} ستاره
                </p>
              </div>
              {item.comment ? (
                <p className="mt-2 text-sm leading-7 text-slate-300">
                  {item.comment}
                </p>
              ) : null}
            </AdminCard>
          ))
        )}
      </div>
    </>
  );
}
