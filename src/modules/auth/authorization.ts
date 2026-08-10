import { Role } from "@prisma/client";
import { AppError } from "@/shared/errors";

type UserWithRoles = { roles: Array<{ role: Role }> };

export function hasRole(user: UserWithRoles, role: Role) {
  return user.roles.some((userRole) => userRole.role === role);
}

export function hasAnyRole(user: UserWithRoles, roles: Role[]) {
  return user.roles.some((userRole) => roles.includes(userRole.role));
}

export function requireRole(user: UserWithRoles, roles: Role[]) {
  if (!hasAnyRole(user, roles)) {
    throw new AppError("FORBIDDEN", "Forbidden", 403);
  }
}
