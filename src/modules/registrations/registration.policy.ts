import { EventStatus, RegistrationStatus } from "@prisma/client";
import { AppError } from "@/shared/errors";

export function resolveRegistrationStatus(input: {
  eventStatus: EventStatus;
  registrationDeadline?: Date | null;
  capacity?: number | null;
  registeredCount: number;
  existingStatus?: RegistrationStatus | null;
  now?: Date;
}) {
  if (input.eventStatus !== EventStatus.PUBLISHED) {
    throw new AppError("REGISTRATION_CLOSED", "Event is not open for registration");
  }

  if (input.registrationDeadline && input.registrationDeadline < (input.now ?? new Date())) {
    throw new AppError("REGISTRATION_CLOSED", "Registration deadline passed");
  }

  if (input.existingStatus === RegistrationStatus.REGISTERED || input.existingStatus === RegistrationStatus.WAITLISTED) {
    throw new AppError("ALREADY_REGISTERED", "User already registered");
  }

  return input.capacity && input.registeredCount >= input.capacity ? RegistrationStatus.WAITLISTED : RegistrationStatus.REGISTERED;
}
