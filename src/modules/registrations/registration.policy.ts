import { EventStatus, RegistrationStatus } from "@prisma/client";
import { AppError } from "@/shared/errors";

export function resolveRegistrationStatus(input: {
  eventStatus: EventStatus;
  capacity?: number | null;
  registeredCount: number;
  existingStatus?: RegistrationStatus | null;
}) {
  if (input.eventStatus !== EventStatus.PUBLISHED) {
    throw new AppError("REGISTRATION_CLOSED", "Event is not open for registration");
  }

  if (
    input.existingStatus === RegistrationStatus.REGISTERED ||
    input.existingStatus === RegistrationStatus.WAITLISTED
  ) {
    throw new AppError("ALREADY_REGISTERED", "User already registered");
  }

  return input.capacity && input.registeredCount >= input.capacity
    ? RegistrationStatus.WAITLISTED
    : RegistrationStatus.REGISTERED;
}
