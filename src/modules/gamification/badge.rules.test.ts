import { describe, expect, it } from "vitest";
import { XPTransactionType } from "@prisma/client";
import { xpRules } from "@/modules/gamification/xp.service";

describe("xpRules", () => {
  it("awards XP for verified attendance only through the central rule table", () => {
    expect(xpRules[XPTransactionType.ATTEND_EVENT]).toBe(100);
  });

  it("awards XP when an event photo is approved", () => {
    expect(xpRules[XPTransactionType.EVENT_PHOTO]).toBe(25);
  });
});
