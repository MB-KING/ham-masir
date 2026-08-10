import { describe, expect, it } from "vitest";
import { buildMapServiceLinks } from "@/lib/maps-links";

describe("buildMapServiceLinks", () => {
  it("builds deep links and web fallbacks for known services", () => {
    const links = buildMapServiceLinks(35.7575, 51.41);
    expect(links).toHaveLength(4);
    expect(links.map((item) => item.id)).toEqual([
      "google",
      "waze",
      "neshan",
      "balad"
    ]);
    expect(links[0].webFallback).toContain("google.com/maps");
    expect(links[1].deepLink).toContain("waze://");
  });

  it("returns empty for invalid coordinates", () => {
    expect(buildMapServiceLinks(Number.NaN, 51)).toEqual([]);
  });
});
