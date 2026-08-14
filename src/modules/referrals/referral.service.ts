import { cookies } from "next/headers";
import { XPTransactionType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { XPService } from "@/modules/gamification/xp.service";

export const REFERRAL_COOKIE = "hm_ref";

export async function applyReferralCredit(referredUserId: string) {
  const jar = await cookies();
  const referrerId = jar.get(REFERRAL_COOKIE)?.value?.trim();
  if (!referrerId || referrerId === referredUserId) return null;
  if (!/^[0-9a-f-]{36}$/i.test(referrerId)) return null;

  const referrer = await prisma.user.findFirst({
    where: { id: referrerId, deletedAt: null },
    select: { id: true }
  });
  if (!referrer) return null;

  return new XPService().award(
    referrer.id,
    XPTransactionType.REFER_USER,
    "User",
    referredUserId,
    "معرفی عضو جدید"
  );
}
