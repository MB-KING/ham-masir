import { describe, expect, it } from "vitest";
import {
  eventShareCaption,
  eventShareDetailsText,
  eventShareTelegramCaption
} from "@/shared/share";

describe("event share copy", () => {
  const details = {
    title: "تست",
    dateLabel: "سه‌شنبه ۲۴ مرداد ۱۴۰۴",
    meetingTime: "۱۹:۴۵",
    startTime: "۲۰:۱۵",
    locationName: "پردیسان",
    locationAddress: "بلوار جنوبی"
  };

  it("includes date, both times, place and address", () => {
    const text = eventShareDetailsText(details);
    expect(text).toContain("تست");
    expect(text).toContain("سه‌شنبه ۲۴ مرداد ۱۴۰۴");
    expect(text).toContain("ساعت جمع شدن ۱۹:۴۵");
    expect(text).toContain("ساعت شروع مسیر ۲۰:۱۵");
    expect(text).toContain("پردیسان");
    expect(text).toContain("بلوار جنوبی");
  });

  it("keeps the Telegram caption short without clocks or urls", () => {
    const caption = eventShareTelegramCaption("تست");
    expect(caption).toContain("تست");
    expect(caption).not.toContain("۱۹:۴۵");
    expect(caption).not.toContain("http");
  });

  it("appends the referral url in the long caption", () => {
    const caption = eventShareCaption(
      details,
      "https://hammasir.mbking.info/events/1"
    );
    expect(caption).toContain("https://hammasir.mbking.info/events/1");
  });
});
