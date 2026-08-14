import {
  BriefcaseBusiness,
  Footprints,
  Trophy,
  UsersRound
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { UserAvatar } from "@/components/user/user-avatar";
import { UserCard, UserPageHeader } from "@/components/user/user-card";
import { UserPageShell } from "@/components/user/user-shell";
import { prisma } from "@/lib/prisma";
import { requireCurrentUserPage } from "@/modules/auth/session";
import { formatSteps } from "@/shared/steps";

export const dynamic = "force-dynamic";

type SortMode = "recent" | "steps";

function buildMembersHref(input: {
  sort: SortMode;
  category?: string;
  page?: number;
}) {
  const params = new URLSearchParams();
  if (input.sort === "steps") params.set("sort", "steps");
  if (input.category) params.set("category", input.category);
  if (input.page && input.page > 1) params.set("page", String(input.page));
  const query = params.toString();
  return (query ? `/members?${query}` : "/members") as Route;
}

export default async function MembersPage({
  searchParams
}: {
  searchParams: Promise<{ category?: string; sort?: string; page?: string }>;
}) {
  const currentUser = await requireCurrentUserPage();
  const { category, sort: sortRaw, page: pageRaw } = await searchParams;
  const sort: SortMode = sortRaw === "steps" ? "steps" : "recent";
  const page = Math.max(Number(pageRaw ?? 1) || 1, 1);
  const take = 20;
  const skip = (page - 1) * take;

  const community = await prisma.community.findUnique({
    where: { id: currentUser.communityId },
    select: { leaderboardEnabled: true }
  });

  const [categories, total, members] = await Promise.all([
    prisma.workCategory.findMany({
      where: { communityId: currentUser.communityId, isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }]
    }),
    prisma.user.count({
      where: {
        communityId: currentUser.communityId,
        deletedAt: null,
        profile: { is: { showInMembersDirectory: true } },
        ...(category ? { workCategoryId: category } : {})
      }
    }),
    prisma.user.findMany({
      where: {
        communityId: currentUser.communityId,
        deletedAt: null,
        profile: { is: { showInMembersDirectory: true } },
        ...(category ? { workCategoryId: category } : {})
      },
      orderBy:
        sort === "steps"
          ? [{ xp: "desc" }, { joinedAt: "asc" }]
          : [{ joinedAt: "desc" }],
      take,
      skip,
      include: {
        profile: true,
        workCategory: true,
        _count: { select: { attendance: { where: { status: "PRESENT" } } } },
        businessMemberships: {
          where: { business: { status: "APPROVED", deletedAt: null } },
          include: { business: true }
        }
      }
    })
  ]);

  let myRank: number | null = null;
  if (sort === "steps" && community?.leaderboardEnabled) {
    const better = await prisma.user.count({
      where: {
        communityId: currentUser.communityId,
        deletedAt: null,
        profile: { is: { showInMembersDirectory: true } },
        OR: [
          { xp: { gt: currentUser.xp } },
          { xp: currentUser.xp, joinedAt: { lt: currentUser.joinedAt } }
        ]
      }
    });
    myRank = better + 1;
  }

  const totalPages = Math.max(Math.ceil(total / take), 1);

  return (
    <UserPageShell>
      <UserPageHeader
        title="همراهان"
        subtitle={
          sort === "steps"
            ? "رتبه‌بندی همراهان بر اساس امتیاز."
            : "اعضایی که می‌خواهند در جامعه دیده شوند."
        }
        backFallbackHref="/me"
      />

      <div className="mb-4 grid grid-cols-2 gap-2">
        <Link
          href={buildMembersHref({ sort: "recent", category })}
          className={`inline-flex min-h-11 items-center justify-center rounded-xl px-3 text-sm font-bold ${
            sort === "recent"
              ? "bg-[#F59E0B] text-[#061124]"
              : "bg-white/10 text-slate-200"
          }`}
        >
          تازه‌ها
        </Link>
        <Link
          href={buildMembersHref({ sort: "steps", category })}
          className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-3 text-sm font-bold ${
            sort === "steps"
              ? "bg-[#F59E0B] text-[#061124]"
              : "bg-white/10 text-slate-200"
          }`}
        >
          <Trophy size={15} aria-hidden="true" />
          بیشترین امتیاز
        </Link>
      </div>

      {sort === "steps" && myRank ? (
        <UserCard className="mb-4 border-[#F59E0B]/25 bg-[#0B1E43]">
          <div className="flex items-center gap-3">
            <Trophy className="text-[#F59E0B]" size={22} />
            <div>
              <p className="font-black text-white">
                رتبه تو: {myRank.toLocaleString("fa-IR")}
              </p>
              <p className="text-sm text-slate-300">
                {formatSteps(currentUser.xp)}
              </p>
            </div>
          </div>
        </UserCard>
      ) : null}

      {categories.length > 0 ? (
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          <Link
            href={buildMembersHref({ sort })}
            className={`shrink-0 rounded-xl px-3 py-2 text-xs font-bold ${
              !category
                ? "bg-[#F59E0B] text-[#061124]"
                : "bg-white/10 text-slate-200"
            }`}
          >
            همه
          </Link>
          {categories.map((item) => (
            <Link
              key={item.id}
              href={buildMembersHref({ sort, category: item.id })}
              className={`shrink-0 rounded-xl px-3 py-2 text-xs font-bold ${
                category === item.id
                  ? "bg-[#F59E0B] text-[#061124]"
                  : "bg-white/10 text-slate-200"
              }`}
            >
              {item.name}
            </Link>
          ))}
        </div>
      ) : null}

      <div className="grid gap-3">
        {members.length === 0 ? (
          <UserCard className="py-10 text-center">
            <UsersRound className="mx-auto text-slate-500" size={32} />
            <h2 className="mt-3 font-black text-white">
              هنوز پروفایل عمومی وجود ندارد
            </h2>
          </UserCard>
        ) : (
          members.map((member, index) => {
            const name =
              [member.firstName, member.lastName].filter(Boolean).join(" ") ||
              member.username ||
              "عضو هم مسیر";
            const rank = skip + index + 1;
            return (
              <Link key={member.id} href={`/members/${member.id}` as Route}>
                <UserCard>
                  <div className="flex items-start gap-3">
                    {sort === "steps" ? (
                      <span className="w-8 shrink-0 pt-2 text-center text-sm font-black text-[#F59E0B]">
                        {rank.toLocaleString("fa-IR")}
                      </span>
                    ) : null}
                    <UserAvatar
                      photoUrl={member.photoUrl}
                      name={name}
                      size={44}
                    />
                    <div className="min-w-0 flex-1">
                      <h2 className="font-black text-white">
                        {name}
                        {member.id === currentUser.id ? (
                          <span className="mr-2 text-xs text-[#F59E0B]">
                            (خودت)
                          </span>
                        ) : null}
                      </h2>
                      {sort === "steps" ? (
                        <p className="mt-1 text-sm text-slate-400">
                          {formatSteps(member.xp)}
                        </p>
                      ) : null}
                      {member.profile?.showWorkCategory !== false &&
                      member.workCategory ? (
                        <p className="mt-1 text-xs font-bold text-[#F59E0B]">
                          {member.workCategory.name}
                        </p>
                      ) : null}
                      {member.profile?.showTelegramUsername &&
                      member.username ? (
                        <p className="mt-1 text-sm text-slate-400" dir="ltr">
                          @{member.username}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  {member.profile?.bio && sort === "recent" ? (
                    <p className="mt-3 text-sm leading-7 text-slate-300">
                      {member.profile.bio}
                    </p>
                  ) : null}
                  {sort === "recent" ? (
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-300">
                      {member.profile?.showAttendanceCount ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.07] px-3 py-1.5">
                          <Footprints size={14} className="text-[#F59E0B]" />
                          {member._count.attendance} حضور
                        </span>
                      ) : null}
                      {member.profile?.showBusiness
                        ? member.businessMemberships.map(({ business }) => (
                            <span
                              key={business.id}
                              className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.07] px-3 py-1.5"
                            >
                              <BriefcaseBusiness
                                size={14}
                                className="text-[#F59E0B]"
                              />
                              {business.name}
                            </span>
                          ))
                        : null}
                    </div>
                  ) : null}
                </UserCard>
              </Link>
            );
          })
        )}
      </div>

      <div className="mt-4 flex gap-2">
        {page > 1 ? (
          <Link
            href={buildMembersHref({ sort, category, page: page - 1 })}
            className="inline-flex h-11 flex-1 items-center justify-center rounded-xl bg-white/10 text-sm font-bold text-white"
          >
            قبلی
          </Link>
        ) : null}
        {page < totalPages ? (
          <Link
            href={buildMembersHref({ sort, category, page: page + 1 })}
            className="inline-flex h-11 flex-1 items-center justify-center rounded-xl bg-[#F59E0B] text-sm font-black text-[#061124]"
          >
            بعدی
          </Link>
        ) : null}
      </div>
    </UserPageShell>
  );
}
