import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { requireRole } from "@/modules/auth/authorization";
import { requireCurrentUserPage } from "@/modules/auth/session";

export const adminRoles = [Role.ADMIN, Role.SUPER_ADMIN];
export const eventManagerRoles = [Role.ADMIN, Role.SUPER_ADMIN];

export async function requireAdminPage() {
  const user = await requireCurrentUserPage();
  requireRole(user, adminRoles);
  return user;
}

export async function requireEventManagerPage() {
  const user = await requireCurrentUserPage();
  requireRole(user, eventManagerRoles);
  return user;
}

export async function requireSuperAdminPage() {
  const user = await requireCurrentUserPage();
  if (!user.roles.some((item) => item.role === Role.SUPER_ADMIN)) {
    redirect("/admin/forbidden");
  }
  return user;
}
