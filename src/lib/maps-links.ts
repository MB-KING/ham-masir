export type MapServiceId = "neshan" | "balad" | "google" | "waze";

export type MapServiceLink = {
  id: MapServiceId;
  name: string;
  /**
   * Native scheme for installed apps (outside Telegram only).
   * Inside Telegram Mini App these are blocked — use `webFallback`.
   */
  deepLink: string;
  /**
   * HTTPS universal / app-link URL. Preferred everywhere, especially Telegram
   * (`WebApp.openLink`), because custom schemes fail in the Mini App WebView.
   */
  webFallback: string;
};

function formatCoord(value: number) {
  // Prisma Decimal(9,6) and float noise — keep stable lat/lng strings.
  return Number(value.toFixed(6)).toString();
}

/**
 * Build navigation links for Iranian + international map apps.
 *
 * Formats follow public docs / verified live URLs:
 * - Neshan: map_launcher / DeeplinkX (`neshan://?destination=`, SPA routing path)
 * - Balad: official share location URL (`/location?latitude=&longitude=`)
 * - Google: Maps URLs (`/maps/dir/?api=1&destination=&travelmode=driving`)
 * - Waze: Deep Links (`https://waze.com/ul?ll=&navigate=yes`)
 */
export function buildMapServiceLinks(
  latitude: number,
  longitude: number
): MapServiceLink[] {
  const latNum = Number(latitude);
  const lngNum = Number(longitude);
  if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) {
    return [];
  }

  const lat = formatCoord(latNum);
  const lng = formatCoord(lngNum);
  const latLng = `${lat},${lng}`;
  const latLngEncoded = encodeURIComponent(latLng);

  return [
    {
      id: "neshan",
      name: "نشان",
      // iOS / native: https://github.com/DeepLinkX/DeeplinkX/blob/master/doc/apps/neshan.md
      deepLink: `neshan://?destination=${latLng}`,
      // Verified: SPA opens routing UI with destination filled.
      webFallback: `https://neshan.org/maps/routing/car/destination/${lat},${lng}`
    },
    {
      id: "balad",
      name: "بلد",
      deepLink: `balad://location?latitude=${lat}&longitude=${lng}`,
      // Official share format — `/directions/driving?destination=` does not
      // resolve coordinates into a route on the static Next export.
      webFallback: `https://balad.ir/location?latitude=${lat}&longitude=${lng}&zoom=16`
    },
    {
      id: "google",
      name: "Google Maps",
      // https://developers.google.com/maps/documentation/urls/ios-urlscheme
      deepLink: `comgooglemaps://?daddr=${latLng}&directionsmode=driving`,
      // https://developers.google.com/maps/documentation/urls/get-started#directions-action
      webFallback: `https://www.google.com/maps/dir/?api=1&destination=${latLngEncoded}&travelmode=driving`
    },
    {
      id: "waze",
      name: "Waze",
      // Only when the app is known installed; otherwise prefer HTTPS.
      deepLink: `waze://?ll=${latLng}&navigate=yes`,
      // https://developers.google.com/waze/deeplinks
      webFallback: `https://waze.com/ul?ll=${latLngEncoded}&navigate=yes`
    }
  ];
}
