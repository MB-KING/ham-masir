import { ExternalLink, Megaphone, UsersRound } from "lucide-react";
import { UserCard, UserPageHeader } from "@/components/user/user-card";
import { UserPageShell } from "@/components/user/user-shell";
import { defaultCommunitySlug } from "@/lib/config";
import { prisma } from "@/lib/prisma";
import { getOptionalCurrentUser } from "@/modules/auth/session";

export const dynamic = "force-dynamic";

export default async function CommunityResourcesPage() {
  const user = await getOptionalCurrentUser();
  const community = await prisma.community.findFirst({
    where: user
      ? { id: user.communityId }
      : { slug: defaultCommunitySlug, isActive: true }
  });

  const resources = community
    ? await prisma.telegramResource.findMany({
        where: { communityId: community.id, isActive: true },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
      })
    : [];

  return (
    <UserPageShell>
      <UserPageHeader
        title="منابع تلگرام"
        subtitle="گروه‌ها و کانال‌های رسمی هم مسیر."
        backFallbackHref="/me"
      />
      <div className="grid gap-3">
        {resources.length === 0 ? (
          <UserCard className="py-10 text-center text-sm text-slate-400">
            هنوز منبع رسمی ثبت نشده است.
          </UserCard>
        ) : (
          resources.map((resource) => (
            <a
              key={resource.id}
              href={resource.link}
              target="_blank"
              rel="noreferrer"
              className="block"
            >
              <UserCard className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F59E0B]/15 text-[#F59E0B]">
                  {resource.type === "CHANNEL" ? (
                    <Megaphone size={20} />
                  ) : (
                    <UsersRound size={20} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="font-black text-white">{resource.name}</h2>
                    <ExternalLink size={16} className="text-[#F59E0B]" />
                  </div>
                  <p className="mt-1 text-xs font-bold text-[#F59E0B]">
                    {resource.type === "CHANNEL" ? "کانال" : "گروه"}
                  </p>
                  {resource.description ? (
                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      {resource.description}
                    </p>
                  ) : null}
                </div>
              </UserCard>
            </a>
          ))
        )}
      </div>
    </UserPageShell>
  );
}
