import {
  BriefcaseBusiness,
  Footprints,
  UsersRound
} from "lucide-react";
import { UserAvatar } from "@/components/user/user-avatar";
import { UserCard, UserPageHeader } from "@/components/user/user-card";
import { UserPageShell } from "@/components/user/user-shell";
import { prisma } from "@/lib/prisma";
import { requireCurrentUserPage } from "@/modules/auth/session";

export const dynamic = "force-dynamic";

export default async function MembersPage() {
  const currentUser = await requireCurrentUserPage();
  const members = await prisma.user.findMany({
    where: {
      communityId: currentUser.communityId,
      deletedAt: null,
      profile: { is: { showInMembersDirectory: true } }
    },
    orderBy: { joinedAt: "desc" },
    include: {
      profile: true,
      _count: { select: { attendance: { where: { status: "PRESENT" } } } },
      businessMemberships: {
        where: { business: { status: "APPROVED", deletedAt: null } },
        include: { business: true }
      }
    }
  });

  return (
    <UserPageShell>
        <UserPageHeader
          title="همراهان"
          subtitle="اعضایی که می‌خواهند در جامعه دیده شوند."
          backFallbackHref="/me"
        />
        <div className="grid gap-3">
          {members.length === 0 ? (
            <UserCard className="py-10 text-center">
              <UsersRound className="mx-auto text-slate-500" size={32} />
              <h2 className="mt-3 font-black text-white">
                هنوز پروفایل عمومی وجود ندارد
              </h2>
            </UserCard>
          ) : (
            members.map((member) => {
              const name =
                [member.firstName, member.lastName].filter(Boolean).join(" ") ||
                member.username ||
                "عضو هم مسیر";
              return (
                <UserCard key={member.id}>
                  <div className="flex items-start gap-3">
                    <UserAvatar
                      photoUrl={member.photoUrl}
                      name={name}
                      size={44}
                    />
                    <div className="min-w-0">
                      <h2 className="font-black text-white">
                        {name}
                        {member.id === currentUser.id ? (
                          <span className="mr-2 text-xs text-[#F59E0B]">
                            (خودت)
                          </span>
                        ) : null}
                      </h2>
                      {member.profile?.showTelegramUsername &&
                      member.username ? (
                        <p className="mt-1 text-sm text-slate-400" dir="ltr">
                          @{member.username}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  {member.profile?.bio ? (
                    <p className="mt-3 text-sm leading-7 text-slate-300">
                      {member.profile.bio}
                    </p>
                  ) : null}
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
                </UserCard>
              );
            })
          )}
        </div>
    </UserPageShell>
  );
}
