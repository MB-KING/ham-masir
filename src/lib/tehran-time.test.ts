import { describe, expect, it } from "vitest";
import {
  tehranDateInputValue,
  tehranTimeInputValue,
  tehranWallTimeToUtc
} from "@/lib/tehran-time";

describe("tehranWallTimeToUtc", () => {
  it("maps 09:00 Tehran to 05:30 UTC", () => {
    const value = tehranWallTimeToUtc("2026-08-11", "09:00");
    expect(value.toISOString()).toBe("2026-08-11T05:30:00.000Z");
  });

  it("round-trips through input helpers", () => {
    const value = tehranWallTimeToUtc("2026-03-21", "18:45");
    expect(tehranDateInputValue(value)).toBe("2026-03-21");
    expect(tehranTimeInputValue(value)).toBe("18:45");
  });
});
