import type { Route } from "next";
import Link from "next/link";
import { Trophy } from "lucide-react";
import { UserAvatar } from "@/components/user/user-avatar";
import { UserCard, UserPageHeader } from "@/components/user/user-card";
import { UserPageShell } from "@/components/user/user-shell";
import { defaultCommunitySlug } from "@/lib/config";
import { prisma } from "@/lib/prisma";
import { getOptionalCurrentUser } from "@/modules/auth/session";
import { getDisplayName } from "@/shared/privacy";
import { formatSteps } from "@/shared/steps";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage({
  searchParams
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await getOptionalCurrentUser();
  const { page: pageRaw } = await searchParams;
  const page = Math.max(Number(pageRaw ?? 1) || 1, 1);
  const take = 20;
  const skip = (page - 1) * take;

  const community = await prisma.community.findFirst({
    where: user
      ? { id: user.communityId }
      : { slug: defaultCommunitySlug, isActive: true }
  });

  if (!community?.leaderboardEnabled) {
    return (
      <UserPageShell>
        <UserPageHeader title="جدول گام" subtitle="این بخش فعلا غیرفعال است." />
        <UserCard className="py-10 text-center text-sm text-slate-400">
          جدول گام توسط مدیر جامعه غیرفعال شده است.
        </UserCard>
      </UserPageShell>
    );
  }

  const [rows, total] = await Promise.all([
    prisma.user.findMany({
      where: {
        communityId: community.id,
        deletedAt: null,
        profile: { showInMembersDirectory: true }
      },
      orderBy: [{ xp: "desc" }, { joinedAt: "asc" }],
      take,
      skip,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        photoUrl: true,
        xp: true,
        badges: {
          take: 3,
          include: { badge: { select: { name: true, icon: true } } }
        }
      }
    }),
    prisma.user.count({
      where: {
        communityId: community.id,
        deletedAt: null,
        profile: { showInMembersDirectory: true }
      }
    })
  ]);

  let myRank: number | null = null;
  if (user) {
    const better = await prisma.user.count({
      where: {
        communityId: community.id,
        deletedAt: null,
        OR: [
          { xp: { gt: user.xp } },
          { xp: user.xp, joinedAt: { lt: user.joinedAt } }
        ]
      }
    });
    myRank = better + 1;
  }

  const totalPages = Math.max(Math.ceil(total / take), 1);

  return (
    <UserPageShell>
      <UserPageHeader
        title="جدول گام"
        subtitle="رتبه‌بندی همراهان بر اساس گام‌های هم مسیر."
        backFallbackHref="/me"
      />
      {myRank ? (
        <UserCard className="mb-4 border-[#F59E0B]/25 bg-[#0B1E43]">
          <div className="flex items-center gap-3">
            <Trophy className="text-[#F59E0B]" size={22} />
            <div>
              <p className="font-black text-white">
                رتبه تو: {myRank.toLocaleString("fa-IR")}
              </p>
              <p className="text-sm text-slate-300">{formatSteps(user!.xp)}</p>
            </div>
          </div>
        </UserCard>
      ) : null}
      <div className="grid gap-3">
        {rows.map((row, index) => {
          const rank = skip + index + 1;
          const name = getDisplayName(row);
          return (
            <Link key={row.id} href={`/members/${row.id}` as Route}>
              <UserCard className="flex items-center gap-3">
                <span className="w-8 text-center text-sm font-black text-[#F59E0B]">
                  {rank.toLocaleString("fa-IR")}
                </span>
                <UserAvatar photoUrl={row.photoUrl} name={name} size={44} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-black text-white">{name}</p>
                  <p className="text-sm text-slate-400">{formatSteps(row.xp)}</p>
                </div>
              </UserCard>
            </Link>
          );
        })}
      </div>
      <div className="mt-4 flex gap-2">
        {page > 1 ? (
          <Link
            href={`/leaderboard?page=${page - 1}` as Route}
            className="inline-flex h-11 flex-1 items-center justify-center rounded-xl bg-white/10 text-sm font-bold text-white"
          >
            قبلی
          </Link>
        ) : null}
        {page < totalPages ? (
          <Link
            href={`/leaderboard?page=${page + 1}` as Route}
            className="inline-flex h-11 flex-1 items-center justify-center rounded-xl bg-[#F59E0B] text-sm font-black text-[#061124]"
          >
            بعدی
          </Link>
        ) : null}
      </div>
    </UserPageShell>
  );
}
