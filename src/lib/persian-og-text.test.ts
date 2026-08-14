import { describe, expect, it } from "vitest";
import { persianForOg, reshapePersian, visualRtl } from "@/lib/persian-og-text";

describe("persianForOg", () => {
  it("joins Persian letters instead of leaving isolated forms", () => {
    const shaped = reshapePersian("تست");
    expect(shaped).not.toBe("تست");
    expect(shaped.charCodeAt(0)).toBeGreaterThan(0xfb00);
  });

  it("keeps Persian digits in reading order", () => {
    const visual = visualRtl("برنامه ۱۱۹");
    expect(visual.includes("۱۱۹") || visual.includes("119")).toBe(true);
    expect(visual.includes("۹۱۱")).toBe(false);
  });

  it("keeps clock times in reading order", () => {
    const visual = persianForOg("۲۴ مرداد · ۱۹:۴۵");
    expect(visual.includes("۱۹:۴۵")).toBe(true);
    expect(visual.includes("۴۵:۱۹")).toBe(false);
  });

  it("puts the first logical word on the right of the visual string", () => {
    const visual = persianForOg("هم مسیر");
    expect(visual.at(-1)).toBe(reshapePersian("هم")[0]);
  });

  it("does not inject bidi control characters", () => {
    const visual = persianForOg("من در این برنامه هستم");
    expect(visual).not.toMatch(/[\u200F\u202A-\u202E\u2066-\u2069]/);
  });
});
