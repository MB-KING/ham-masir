import { describe, expect, it } from "vitest";
import { buildMapServiceLinks } from "@/lib/maps-links";

describe("buildMapServiceLinks", () => {
  it("builds documented deep links and HTTPS fallbacks", () => {
    const links = buildMapServiceLinks(35.7575, 51.41);
    expect(links.map((item) => item.id)).toEqual([
      "neshan",
      "balad",
      "google",
      "waze"
    ]);

    const byId = Object.fromEntries(links.map((item) => [item.id, item]));

    expect(byId.neshan.deepLink).toBe("neshan://?destination=35.7575,51.41");
    expect(byId.neshan.webFallback).toBe(
      "https://neshan.org/maps/routing/car/destination/35.7575,51.41"
    );

    expect(byId.balad.deepLink).toContain("latitude=35.7575");
    expect(byId.balad.deepLink).toContain("longitude=51.41");
    expect(byId.balad.webFallback).toBe(
      "https://balad.ir/location?latitude=35.7575&longitude=51.41&zoom=16"
    );

    expect(byId.google.webFallback).toContain(
      "https://www.google.com/maps/dir/?api=1"
    );
    expect(byId.google.webFallback).toContain("travelmode=driving");
    expect(byId.google.webFallback).toContain(
      encodeURIComponent("35.7575,51.41")
    );

    expect(byId.waze.webFallback).toBe(
      `https://waze.com/ul?ll=${encodeURIComponent("35.7575,51.41")}&navigate=yes`
    );
    expect(byId.waze.deepLink).toBe("waze://?ll=35.7575,51.41&navigate=yes");
  });

  it("returns empty for invalid coordinates", () => {
    expect(buildMapServiceLinks(Number.NaN, 51)).toEqual([]);
    expect(buildMapServiceLinks(35, Number.POSITIVE_INFINITY)).toEqual([]);
  });
});
