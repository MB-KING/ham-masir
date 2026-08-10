import { AttendanceStatus, AttendanceVerificationMethod } from "@prisma/client";
import { z } from "zod";

export const verifyAttendanceSchema = z.object({
  userId: z.string().uuid(),
  status: z.nativeEnum(AttendanceStatus).default(AttendanceStatus.PRESENT),
  verificationMethod: z.nativeEnum(AttendanceVerificationMethod).default(AttendanceVerificationMethod.ADMIN)
});
