import type { Route } from "next";
import Link from "next/link";
import { UserAvatar } from "@/components/user/user-avatar";
import { getDisplayName } from "@/shared/privacy";

type PreviewUser = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  photoUrl: string | null;
};

export function ParticipantsPreview({
  eventId,
  total,
  users
}: {
  eventId: string;
  total: number;
  users: PreviewUser[];
}) {
  return (
    <Link
      href={`/events/${eventId}/participants` as Route}
      className="mt-3 flex min-h-12 items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 transition active:bg-white/10"
    >
      <div className="flex items-center">
        {users.length === 0 ? (
          <span className="text-sm font-bold text-slate-300">
            هنوز کسی ثبت‌نام نکرده
          </span>
        ) : (
          <div className="flex items-center">
            {users.map((user, index) => (
              <div
                key={user.id}
                className="relative ring-2 ring-[#0B1E43] rounded-xl"
                style={{
                  marginInlineStart: index === 0 ? 0 : -10,
                  zIndex: 10 - index
                }}
              >
                <UserAvatar
                  photoUrl={user.photoUrl}
                  name={getDisplayName(user)}
                  size={36}
                />
              </div>
            ))}
            <span className="ms-3 text-sm font-bold text-white">
              {total.toLocaleString("fa-IR")} نفر
            </span>
          </div>
        )}
      </div>
      <span className="text-xs font-bold text-[#F59E0B]">مشاهده</span>
    </Link>
  );
}
