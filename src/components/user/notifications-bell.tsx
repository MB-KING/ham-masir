import { Bell } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireCurrentUserPage } from "@/modules/auth/session";

export async function NotificationsBell() {
  let unreadCount = 0;

  try {
    const user = await requireCurrentUserPage();
    unreadCount = await prisma.notification.count({
      where: { userId: user.id, readAt: null }
    });
  } catch {
    unreadCount = 0;
  }

  return (
    <Link
      href="/notifications"
      aria-label={
        unreadCount > 0
          ? `اعلان‌ها، ${unreadCount} خوانده‌نشده`
          : "اعلان‌ها"
      }
      className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-slate-300 transition active:scale-95 hover:border-sky-400/40 hover:text-white"
    >
      <Bell size={18} aria-hidden="true" />
      {unreadCount > 0 ? (
        <span className="absolute -left-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-sky-400 px-1 text-[10px] font-black text-[#061124]">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      ) : null}
    </Link>
  );
}
