import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdminPage } from "@/modules/auth/admin-session";
import { AppError } from "@/shared/errors";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  try {
    const admin = await requireAdminPage();
    return <AdminShell user={admin}>{children}</AdminShell>;
  } catch (error) {
    if (error instanceof AppError && (error.code === "FORBIDDEN" || error.code === "UNAUTHORIZED")) {
      redirect("/");
    }
    throw error;
  }
}
