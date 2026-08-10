import { Role } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { hasAnyRole, hasRole, requireRole } from "@/modules/auth/authorization";

describe("role authorization", () => {
  const user = { roles: [{ role: Role.USER }] };
  const admin = { roles: [{ role: Role.ADMIN }] };
  const superAdmin = { roles: [{ role: Role.SUPER_ADMIN }] };

  it("keeps regular users out of admin capabilities", () => {
    expect(hasAnyRole(user, [Role.ADMIN, Role.SUPER_ADMIN])).toBe(false);
    expect(() => requireRole(user, [Role.ADMIN, Role.SUPER_ADMIN])).toThrow();
  });

  it("allows admins to manage events but not super-admin settings", () => {
    expect(hasRole(admin, Role.ADMIN)).toBe(true);
    expect(() =>
      requireRole(admin, [Role.ADMIN, Role.SUPER_ADMIN])
    ).not.toThrow();
    expect(() => requireRole(admin, [Role.SUPER_ADMIN])).toThrow();
  });

  it("allows super-admin access to every admin capability", () => {
    expect(() =>
      requireRole(superAdmin, [Role.ADMIN, Role.SUPER_ADMIN])
    ).not.toThrow();
    expect(() => requireRole(superAdmin, [Role.SUPER_ADMIN])).not.toThrow();
  });
});
