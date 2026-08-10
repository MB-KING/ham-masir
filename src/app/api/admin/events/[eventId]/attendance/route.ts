import { Role } from "@prisma/client";
import { requireCurrentUser } from "@/modules/auth/session";
import { requireRole } from "@/modules/auth/authorization";
import { AttendanceService } from "@/modules/attendance/attendance.service";
import { verifyAttendanceSchema } from "@/modules/attendance/attendance.schema";
import { ok, fail, parseJson } from "@/shared/api";

export async function POST(request: Request, { params }: { params: Promise<{ eventId: string }> }) {
  try {
    const admin = await requireCurrentUser();
    requireRole(admin, [Role.ADMIN, Role.SUPER_ADMIN]);
    const { eventId } = await params;
    const input = await parseJson(request, verifyAttendanceSchema);
    const attendance = await new AttendanceService().verify({
      eventId,
      userId: input.userId,
      verifiedById: admin.id,
      status: input.status
    });
    return ok(attendance);
  } catch (error) {
    return fail(error);
  }
}
