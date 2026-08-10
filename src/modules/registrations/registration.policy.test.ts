import { describe, expect, it } from "vitest";
import { EventStatus, RegistrationStatus } from "@prisma/client";
import { AppError } from "@/shared/errors";
import { resolveRegistrationStatus } from "@/modules/registrations/registration.policy";

describe("resolveRegistrationStatus", () => {
  it("registers when event is published and has capacity", () => {
    expect(
      resolveRegistrationStatus({
        eventStatus: EventStatus.PUBLISHED,
        capacity: 10,
        registeredCount: 3
      })
    ).toBe(RegistrationStatus.REGISTERED);
  });

  it("waitlists when capacity is full", () => {
    expect(
      resolveRegistrationStatus({
        eventStatus: EventStatus.PUBLISHED,
        capacity: 2,
        registeredCount: 2
      })
    ).toBe(RegistrationStatus.WAITLISTED);
  });

  it("rejects duplicate active registration", () => {
    expect(() =>
      resolveRegistrationStatus({
        eventStatus: EventStatus.PUBLISHED,
        registeredCount: 0,
        existingStatus: RegistrationStatus.REGISTERED
      })
    ).toThrow(AppError);
  });

  it("rejects closed registration deadlines", () => {
    expect(() =>
      resolveRegistrationStatus({
        eventStatus: EventStatus.PUBLISHED,
        registeredCount: 0,
        registrationDeadline: new Date("2026-01-01T00:00:00.000Z"),
        now: new Date("2026-01-02T00:00:00.000Z")
      })
    ).toThrow(AppError);
  });
});
