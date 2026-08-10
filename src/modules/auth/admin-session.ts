import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { hasAnyRole } from "@/modules/auth/authorization";
import {
  getOptionalCurrentUser,
  requireCurrentUserPage
} from "@/modules/auth/session";

export const adminRoles = [Role.ADMIN, Role.SUPER_ADMIN];
export const eventManagerRoles = [Role.ADMIN, Role.SUPER_ADMIN];

export async function requireAdminPage() {
  const user = await getOptionalCurrentUser();
  if (!user) {
    redirect("/open-in-telegram");
  }
  if (!hasAnyRole(user, adminRoles)) {
    redirect("/admin/forbidden");
  }
  return user;
}

export async function requireEventManagerPage() {
  const user = await getOptionalCurrentUser();
  if (!user) {
    redirect("/open-in-telegram");
  }
  if (!hasAnyRole(user, eventManagerRoles)) {
    redirect("/admin/forbidden");
  }
  return user;
}

export async function requireSuperAdminPage() {
  const user = await requireCurrentUserPage();
  if (!user.roles.some((item) => item.role === Role.SUPER_ADMIN)) {
    redirect("/admin/forbidden");
  }
  return user;
}
